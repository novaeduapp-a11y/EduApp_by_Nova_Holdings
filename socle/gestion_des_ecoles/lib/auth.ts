import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { logActivite } from "@/lib/activity-log";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      nom: string;
      prenom: string;
      role: Role;
      photo?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
    photo?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
    photo?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Derrière Nginx : accepter Host / proto proxyfiés (évite MissingCSRF en prod).
  trustHost: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  // Éviter le préfixe __Host- (plus fragile derrière reverse-proxy / www).
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email ou Téléphone", type: "text" },
        password: { label: "Mot de passe", type: "password" },
        challengeId: { label: "Challenge 2FA", type: "text" },
        code: { label: "Code 2FA", type: "text" },
        ecoleId: { label: "Établissement", type: "text" },
      },
      async authorize(credentials) {
        const challengeId = String(credentials?.challengeId ?? "").trim();
        const code = String(credentials?.code ?? "").trim();
        const ecoleId = String(credentials?.ecoleId ?? "").trim();

        if (challengeId && code) {
          const challenge = await prisma.twoFactorChallenge.findUnique({
            where: { id: challengeId },
            include: { user: true },
          });
          if (!challenge || challenge.usedAt || challenge.expiresAt < new Date()) {
            throw new Error("Code 2FA invalide ou expiré");
          }
          const codeOk = await bcrypt.compare(code, challenge.codeHash);
          if (!codeOk || !challenge.user.actif || !challenge.user.twoFactorEnabled) {
            throw new Error("Code 2FA invalide ou expiré");
          }
          if (ecoleId && challenge.user.role !== "ADMIN" && challenge.user.ecoleId !== ecoleId) {
            throw new Error("Établissement incorrect");
          }
          await prisma.twoFactorChallenge.update({
            where: { id: challenge.id },
            data: { usedAt: new Date() },
          });
          await logActivite({
            userId: challenge.user.id,
            action: "connexion",
            details: { voie: "web", role: challenge.user.role, a2f: true },
          });
          return {
            id: challenge.user.id,
            email: challenge.user.email,
            nom: challenge.user.nom,
            prenom: challenge.user.prenom,
            role: challenge.user.role,
            photo: challenge.user.photo,
          };
        }

        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/Téléphone/Matricule et mot de passe requis");
        }

        const identifier = (credentials.identifier as string).trim();
        const isEmail = identifier.includes("@");
        const isMatricule = /^\d{4}[A-Za-z]{2,3}\d+$/.test(identifier); // Format: 2025CI001
        
        let user;
        if (isEmail) {
          // Connexion par email
          user = await prisma.user.findUnique({
            where: { email: identifier },
          });
        } else if (isMatricule) {
          // Connexion par matricule (pour les élèves)
          const eleve = await prisma.eleve.findUnique({
            where: { matricule: identifier.toUpperCase() },
            include: { user: true },
          });
          user = eleve?.user || null;
        } else {
          // Connexion par téléphone - normaliser et matcher exactement
          // Format Sénégal: +221 77 123 45 67 ou 77 123 45 67 ou 771234567
          const phoneNormalized = identifier.replace(/[\s\-\.]/g, "").replace(/^\+221/, "");
          
          // Chercher avec correspondance exacte du numéro normalisé
          const users = await prisma.user.findMany({
            where: {
              telephone: { not: null },
              actif: true,
            },
            select: {
              id: true,
              telephone: true,
              email: true,
              nom: true,
              prenom: true,
              password: true,
              role: true,
              photo: true,
              actif: true,
              twoFactorEnabled: true,
              mustChangePassword: true,
              ecoleId: true,
            },
          });

          // Trouver le user dont le téléphone normalisé correspond exactement
          user = users.find((u) => {
            if (!u.telephone) return false;
            const dbPhoneNormalized = u.telephone.replace(/[\s\-\.]/g, "").replace(/^\+221/, "");
            return dbPhoneNormalized === phoneNormalized;
          }) || null;
        }

        if (!user || !user.actif) {
          await logActivite({
            action: "connexion_refusee",
            details: { voie: "web", identifiant: identifier.slice(0, 80), motif: "inconnu_ou_inactif" },
          });
          throw new Error("Identifiants invalides");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          await logActivite({
            userId: user.id,
            action: "connexion_refusee",
            details: { voie: "web", motif: "mot_de_passe" },
          });
          throw new Error("Identifiants invalides");
        }

        if (user.twoFactorEnabled) {
          throw new Error("2FA_REQUIRED");
        }

        if (ecoleId && user.role !== "ADMIN" && user.ecoleId !== ecoleId) {
          throw new Error("Établissement incorrect");
        }

        // Vérifier si un changement de mot de passe est requis
        if (user.mustChangePassword) {
          throw new Error("PASSWORD_CHANGE_REQUIRED");
        }

        await logActivite({
          userId: user.id,
          action: "connexion",
          details: { voie: "web", role: user.role, a2f: false },
        });

        return {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          photo: user.photo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.nom = user.nom;
        token.prenom = user.prenom;
        token.role = user.role;
        token.photo = user.photo;
      }
      if (trigger === "update" && session) {
        if (typeof session.nom === "string") token.nom = session.nom;
        if (typeof session.prenom === "string") token.prenom = session.prenom;
        if (typeof session.email === "string") token.email = session.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.nom = token.nom;
        session.user.prenom = token.prenom;
        session.user.role = token.role;
        session.user.photo = token.photo;
      }
      return session;
    },
  },
});
