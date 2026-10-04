import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "@auth/core/jwt";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ecoleMismatch, parsePortail, PORTAIL_ROLES, issueTwoFactorChallenge } from "@/lib/staff-auth";
import { logActivite } from "@/lib/activity-log";
import { verifyTwoFactorCode } from "@/lib/staff-auth";
import {
  recordLoginAttempt,
  isIpBlocked,
  isIdentifierBlocked,
  is2FABlocked,
  getClientIp,
} from "@/lib/rate-limit";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const SESSION_COOKIE = "authjs.session-token";

function authSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

async function setSessionCookie(user: {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  photo?: string | null;
}) {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_SECRET manquant");

  const token = await encode({
    token: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      photo: user.photo ?? null,
      sub: user.id,
    },
    secret,
    salt: SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");
    const challengeId = String(body.challengeId ?? "").trim();
    const code = String(body.code ?? "").trim();
    const portail = parsePortail(body.portail);
    const ecoleId = typeof body.ecoleId === "string" ? body.ecoleId.trim() : "";

    // Vérifier le rate limiting IP
    if (await isIpBlocked(clientIp)) {
      return NextResponse.json(
        { error: "Trop de tentatives échouées. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    // Voie 2FA
    if (challengeId && code) {
      if (await is2FABlocked(challengeId)) {
        return NextResponse.json(
          { error: "Trop de tentatives 2FA incorrectes. Demandez un nouveau code." },
          { status: 429 }
        );
      }

      const user = await verifyTwoFactorCode(challengeId, code);
      if (!user?.actif || !user.twoFactorEnabled) {
        await recordLoginAttempt({
          identifier: challengeId,
          ipAddress: clientIp,
          success: false,
          reason: "2fa_incorrect",
        });
        return NextResponse.json({ error: "Code incorrect ou expiré" }, { status: 401 });
      }
      if (ecoleId && user.role !== "ADMIN" && user.ecoleId !== ecoleId) {
        return NextResponse.json({ error: "Ce compte n'appartient pas à cet établissement" }, { status: 403 });
      }
      if (user.mustChangePassword) {
        return NextResponse.json(
          { error: "Changement de mot de passe requis", code: "PASSWORD_CHANGE_REQUIRED", userId: user.id },
          { status: 403 }
        );
      }
      await logActivite({
        userId: user.id,
        action: "connexion",
        details: { voie: "web-login", role: user.role, a2f: true },
      });
      await recordLoginAttempt({
        userId: user.id,
        identifier: challengeId,
        ipAddress: clientIp,
        success: true,
      });
      await setSessionCookie(user);
      return NextResponse.json({ data: { ok: true, role: user.role } });
    }

    if (!identifier || !password) {
      return NextResponse.json({ error: "Identifiants requis" }, { status: 400 });
    }

    if (await isIdentifierBlocked(identifier)) {
      return NextResponse.json(
        { error: "Trop de tentatives échouées. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    const isEmail = identifier.includes("@");
    const isMatricule = /^\d{4}[A-Za-z]{2,3}\d+$/.test(identifier);

    let user;
    if (isEmail) {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    } else if (isMatricule) {
      const eleve = await prisma.eleve.findUnique({
        where: { matricule: identifier.toUpperCase() },
        include: { user: true },
      });
      user = eleve?.user ?? null;
    } else {
      const phoneNormalized = identifier.replace(/[\s\-\.]/g, "").replace(/^\+221/, "");
      const users = await prisma.user.findMany({
        where: { telephone: { not: null }, actif: true },
        select: {
          id: true, telephone: true, email: true, nom: true, prenom: true, password: true,
          role: true, photo: true, actif: true, twoFactorEnabled: true, mustChangePassword: true, ecoleId: true
        },
      });
      user = users.find((u) => {
        if (!u.telephone) return false;
        const dbPhoneNormalized = u.telephone.replace(/[\s\-\.]/g, "").replace(/^\+221/, "");
        return dbPhoneNormalized === phoneNormalized;
      }) || null;
    }

    if (!user?.actif) {
      await recordLoginAttempt({ identifier, ipAddress: clientIp, success: false, reason: "compte_introuvable" });
      return NextResponse.json(
        { error: "Email, téléphone ou mot de passe incorrect. Vérifiez vos identifiants." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await recordLoginAttempt({ userId: user.id, identifier, ipAddress: clientIp, success: false, reason: "mot_de_passe" });
      return NextResponse.json(
        { error: "Email, téléphone ou mot de passe incorrect. Vérifiez vos identifiants." },
        { status: 401 }
      );
    }

    if (portail && user.role !== PORTAIL_ROLES[portail]) {
      return NextResponse.json({ error: "Ce compte n'appartient pas à ce portail" }, { status: 403 });
    }

    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
      .split(",")[0].trim().split(":")[0].toLowerCase();
    const onAdminHost = host === "admin.eduadmin.net";
    const onPublicHost = host === "eduadmin.net" || host === "www.eduadmin.net";
    const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.eduadmin.net").replace(/\/$/, "");

    if (onAdminHost && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cet espace est réservé à l'administration NOVA. Connectez-vous sur eduadmin.net." },
        { status: 403 }
      );
    }
    if (onPublicHost && user.role === "ADMIN") {
      return NextResponse.json(
        { error: `Connectez-vous sur ${adminUrl.replace(/^https?:\/\//, "")}` },
        { status: 403 }
      );
    }

    if (ecoleMismatch(user, ecoleId || null)) {
      return NextResponse.json({ error: "Ce compte n'appartient pas à cet établissement" }, { status: 403 });
    }

    if (user.mustChangePassword) {
      return NextResponse.json(
        { error: "Changement de mot de passe requis avant la première connexion", code: "PASSWORD_CHANGE_REQUIRED", userId: user.id },
        { status: 403 }
      );
    }

    if (user.twoFactorEnabled) {
      const challenge = await issueTwoFactorChallenge(user.id);
      return NextResponse.json({
        data: {
          requires2fa: true,
          challengeId: challenge.challengeId,
          emailed: challenge.emailed,
          ...(process.env.NODE_ENV !== "production" ? { debugCode: challenge.code } : {}),
        },
      });
    }

    await logActivite({
      userId: user.id,
      action: "connexion",
      details: { voie: "web-login", role: user.role, a2f: false },
    });
    await recordLoginAttempt({ userId: user.id, identifier, ipAddress: clientIp, success: true });
    await setSessionCookie(user);
    return NextResponse.json({ data: { ok: true, role: user.role } });
  } catch (error) {
    console.error("Erreur web-login:", error);
    return NextResponse.json({ error: "Impossible de se connecter. Réessayez." }, { status: 500 });
  }
}
