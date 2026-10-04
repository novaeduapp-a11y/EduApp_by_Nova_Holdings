import { Resend } from "resend";
import {
  convocationMail,
  passwordChangedMail,
  passwordResetMail,
  twoFactorMail,
  welcomeAccountMail,
} from "@/lib/email-templates";

function resendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress() {
  return process.env.RESEND_FROM?.trim() || "EduApps <noreply@eduadmin.net>";
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const client = resendClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY manquant — e-mail non envoyé:", params.subject);
    return { ok: false as const, skipped: true as const };
  }

  const { data, error } = await client.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, id: data?.id };
}

export async function sendTemplatedEmail(
  to: string,
  mail: { subject: string; html: string; text: string }
) {
  return sendEmail({ to, ...mail });
}

/** Code 2FA / sécurité. */
export async function sendTwoFactorEmail(to: string, code: string, prenom?: string) {
  return sendTemplatedEmail(to, twoFactorMail({ prenom, code }));
}

/** Compte créé (admin / staff / parent). */
export async function sendWelcomeAccountEmail(params: {
  to: string;
  prenom?: string;
  role?: string;
  temporaryPassword: string;
  ecoleNom?: string | null;
}) {
  return sendTemplatedEmail(
    params.to,
    welcomeAccountMail({
      prenom: params.prenom,
      email: params.to,
      role: params.role,
      temporaryPassword: params.temporaryPassword,
      ecoleNom: params.ecoleNom,
    })
  );
}

/** Mot de passe réinitialisé par un admin. */
export async function sendPasswordResetEmail(params: {
  to: string;
  prenom?: string;
  role?: string;
  temporaryPassword: string;
}) {
  return sendTemplatedEmail(
    params.to,
    passwordResetMail({
      prenom: params.prenom,
      email: params.to,
      role: params.role,
      temporaryPassword: params.temporaryPassword,
    })
  );
}

/** Confirmation après changement de mot de passe par l’utilisateur. */
export async function sendPasswordChangedEmail(params: { to: string; prenom?: string }) {
  return sendTemplatedEmail(
    params.to,
    passwordChangedMail({ prenom: params.prenom, email: params.to })
  );
}

export async function sendConvocationEmail(params: {
  to: string;
  prenomTuteur?: string;
  nomEleve: string;
  classe: string;
  dateLabel: string;
  motif: string;
}) {
  return sendTemplatedEmail(params.to, convocationMail(params));
}
