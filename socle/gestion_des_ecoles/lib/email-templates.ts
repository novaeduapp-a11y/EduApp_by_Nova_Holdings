/** Templates HTML e-mail EduApps — rendu table (clients mail). */

const BRAND = {
  primary: "#1A5FD4",
  deep: "#0B2F7A",
  ink: "#12203A",
  muted: "#5B6B82",
  canvas: "#F4F7FC",
  card: "#FFFFFF",
  border: "#E2E8F2",
  success: "#0F7A4A",
} as const;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://eduadmin.net").replace(/\/$/, "");
}

/** Origine publique pour les images (Gmail ne charge pas localhost). */
function publicOrigin() {
  const raw = appUrl();
  if (!raw || /localhost|127\.0\.0\.1/.test(raw)) return "https://eduadmin.net";
  return raw;
}

function brandLogoUrl(variant: "eduapps" | "nova") {
  return `${publicOrigin()}/brand/${variant}-logo.png`;
}

function imgLogo(variant: "eduapps" | "nova", size: number) {
  const alt = variant === "eduapps" ? "EduApps" : "NOVA HOLDINGS";
  const src = escapeHtml(brandLogoUrl(variant));
  return `<img src="${src}" width="${size}" height="${size}" alt="${alt}" style="display:block;border:0;outline:none;text-decoration:none;width:${size}px;height:${size}px" />`;
}

function roleLabel(role?: string) {
  switch (role) {
    case "ADMIN":
      return "Administration NOVA";
    case "DIRECTEUR":
      return "Direction";
    case "PREFET":
      return "Préfet";
    case "PROFESSEUR":
      return "Professeur";
    case "PARENT":
      return "Parent";
    case "ELEVE":
      return "Élève";
    default:
      return "EduApps";
  }
}

function loginPathForRole(role?: string) {
  const base = appUrl();
  if (role === "ADMIN") return `${base}/login`;
  if (role === "PARENT") return `${base}/login`;
  if (role === "DIRECTEUR") return `${base}/eduadmins`;
  if (role === "PREFET") return `${base}/eduadmins`;
  if (role === "PROFESSEUR") return `${base}/eduadmins`;
  return base;
}

type MailLayoutProps = {
  preheader?: string;
  title: string;
  greeting?: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footnote?: string;
};

/** Enveloppe moderne partagée par tous les e-mails EduApps. */
export function renderMailLayout(props: MailLayoutProps) {
  const greeting = props.greeting ? escapeHtml(props.greeting) : null;
  const preheader = props.preheader ? escapeHtml(props.preheader) : "";
  const title = escapeHtml(props.title);
  const footnote =
    props.footnote ||
    "Cet e-mail est envoyé automatiquement par EduApps (NOVA HOLDINGS). Ne répondez pas à cette adresse.";

  const ctaBlock = props.cta
    ? `
      <tr>
        <td style="padding:8px 0 28px">
          <a href="${escapeHtml(props.cta.href)}"
             style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;line-height:1;padding:14px 22px;border-radius:999px">
            ${escapeHtml(props.cta.label)}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.canvas};color:${BRAND.ink}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <tr>
            <td style="padding:0 8px 22px">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="padding:0">
                    <a href="${escapeHtml(appUrl())}" style="text-decoration:none">${imgLogo("eduapps", 52)}</a>
                  </td>
                  <td width="12" valign="middle" style="padding:0 12px;font-size:0;line-height:0">
                    <div style="width:1px;height:28px;background:${BRAND.border};margin:0 auto">&nbsp;</div>
                  </td>
                  <td valign="middle" style="padding:0">
                    <a href="${escapeHtml(appUrl())}" style="text-decoration:none">${imgLogo("nova", 48)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:24px;padding:36px 32px;box-shadow:0 18px 40px rgba(11,47,122,0.08)">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
                <tr>
                  <td style="padding:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.primary}">
                    EduApps
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 18px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${BRAND.ink}">
                    ${title}
                  </td>
                </tr>
                ${
                  greeting
                    ? `<tr><td style="padding:0 0 14px;font-size:16px;line-height:1.55;color:${BRAND.ink}">Bonjour ${greeting},</td></tr>`
                    : ""
                }
                <tr>
                  <td style="padding:0 0 8px;font-size:16px;line-height:1.65;color:${BRAND.ink}">
                    ${props.bodyHtml}
                  </td>
                </tr>
                ${ctaBlock}
                <tr>
                  <td style="padding-top:8px;border-top:1px solid ${BRAND.border};font-size:13px;line-height:1.55;color:${BRAND.muted}">
                    ${escapeHtml(footnote)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:${BRAND.muted}">
              <a href="${escapeHtml(appUrl())}" style="display:inline-block;text-decoration:none">${imgLogo("nova", 64)}</a>
              <div style="padding-top:10px;font-size:13px;font-weight:600;color:${BRAND.ink}">Une solution NOVA HOLDINGS</div>
              <div style="padding-top:4px;font-size:12px;line-height:1.5">
                Suite scolaire pour les établissements partenaires · Sénégal<br />
                <a href="${escapeHtml(appUrl())}" style="color:${BRAND.primary};text-decoration:none">${escapeHtml(appUrl().replace(/^https?:\/\//, ""))}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function twoFactorMail(params: { prenom?: string; code: string }) {
  const code = escapeHtml(params.code);
  const html = renderMailLayout({
    preheader: `Votre code EduApps : ${params.code}`,
    title: "Votre code de confirmation",
    greeting: params.prenom?.trim() || undefined,
    bodyHtml: `
      <p style="margin:0 0 18px">Utilisez ce code pour finaliser votre connexion. Il expire dans <strong>10 minutes</strong>.</p>
      <div style="margin:0 0 18px;padding:18px 16px;border-radius:16px;background:${BRAND.canvas};border:1px solid ${BRAND.border};text-align:center">
        <div style="font-size:32px;font-weight:700;letter-spacing:0.28em;color:${BRAND.deep}">${code}</div>
      </div>
      <p style="margin:0;color:${BRAND.muted};font-size:14px">Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>
    `,
    footnote: "Ne partagez jamais ce code. L’équipe EduApps ne vous le demandera pas par téléphone.",
  });
  return {
    subject: `${params.code} — code EduApps`,
    text: `Bonjour${params.prenom ? ` ${params.prenom}` : ""},\n\nVotre code EduApps est ${params.code}.\nIl expire dans 10 minutes.\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.\n`,
    html,
  };
}

export function welcomeAccountMail(params: {
  prenom?: string;
  email: string;
  role?: string;
  temporaryPassword: string;
  ecoleNom?: string | null;
}) {
  const href = loginPathForRole(params.role);
  const role = roleLabel(params.role);
  const html = renderMailLayout({
    preheader: "Votre accès EduApps est prêt",
    title: "Bienvenue sur EduApps",
    greeting: params.prenom?.trim() || undefined,
    bodyHtml: `
      <p style="margin:0 0 14px">Votre compte <strong>${escapeHtml(role)}</strong> a été créé${
        params.ecoleNom ? ` pour <strong>${escapeHtml(params.ecoleNom)}</strong>` : ""
      }.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-radius:16px;background:${BRAND.canvas};border:1px solid ${BRAND.border}">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;color:${BRAND.ink}">
            <div style="margin:0 0 8px"><span style="color:${BRAND.muted}">E-mail</span><br /><strong>${escapeHtml(params.email)}</strong></div>
            <div><span style="color:${BRAND.muted}">Mot de passe temporaire</span><br /><strong style="letter-spacing:0.04em">${escapeHtml(params.temporaryPassword)}</strong></div>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:${BRAND.muted};font-size:14px">Changez ce mot de passe dès votre première connexion.</p>
    `,
    cta: { label: "Se connecter", href },
  });
  return {
    subject: "Votre accès EduApps est prêt",
    text: `Bonjour${params.prenom ? ` ${params.prenom}` : ""},\n\nVotre compte ${role} est prêt.\nE-mail : ${params.email}\nMot de passe temporaire : ${params.temporaryPassword}\nConnexion : ${href}\n\nChangez ce mot de passe dès la première connexion.\n`,
    html,
  };
}

export function passwordResetMail(params: {
  prenom?: string;
  email: string;
  role?: string;
  temporaryPassword: string;
}) {
  const href = loginPathForRole(params.role);
  const html = renderMailLayout({
    preheader: "Nouveau mot de passe EduApps",
    title: "Mot de passe réinitialisé",
    greeting: params.prenom?.trim() || undefined,
    bodyHtml: `
      <p style="margin:0 0 14px">Un administrateur a généré un nouveau mot de passe pour votre compte <strong>${escapeHtml(params.email)}</strong>.</p>
      <div style="margin:0 0 18px;padding:16px 18px;border-radius:16px;background:${BRAND.canvas};border:1px solid ${BRAND.border}">
        <div style="font-size:13px;color:${BRAND.muted};margin-bottom:6px">Mot de passe temporaire</div>
        <div style="font-size:20px;font-weight:700;letter-spacing:0.06em;color:${BRAND.deep}">${escapeHtml(params.temporaryPassword)}</div>
      </div>
      <p style="margin:0;color:${BRAND.muted};font-size:14px">L’ancien mot de passe ne fonctionne plus. Modifiez-le après connexion.</p>
    `,
    cta: { label: "Ouvrir EduApps", href },
  });
  return {
    subject: "Nouveau mot de passe EduApps",
    text: `Bonjour${params.prenom ? ` ${params.prenom}` : ""},\n\nNouveau mot de passe temporaire : ${params.temporaryPassword}\nConnexion : ${href}\n\nL’ancien mot de passe ne fonctionne plus.\n`,
    html,
  };
}

export function passwordChangedMail(params: { prenom?: string; email: string }) {
  const html = renderMailLayout({
    preheader: "Votre mot de passe EduApps a été modifié",
    title: "Mot de passe mis à jour",
    greeting: params.prenom?.trim() || undefined,
    bodyHtml: `
      <p style="margin:0 0 14px">Le mot de passe du compte <strong>${escapeHtml(params.email)}</strong> a bien été modifié.</p>
      <p style="margin:0;color:${BRAND.muted};font-size:14px">Si vous n’êtes pas à l’origine de ce changement, contactez immédiatement votre établissement ou NOVA HOLDINGS.</p>
    `,
    cta: { label: "Aller sur EduApps", href: appUrl() },
  });
  return {
    subject: "Mot de passe EduApps modifié",
    text: `Bonjour${params.prenom ? ` ${params.prenom}` : ""},\n\nLe mot de passe de ${params.email} a été modifié.\nSi ce n’était pas vous, contactez votre établissement.\n`,
    html,
  };
}

export function convocationMail(params: {
  prenomTuteur?: string;
  nomEleve: string;
  classe: string;
  dateLabel: string;
  motif: string;
}) {
  const html = renderMailLayout({
    preheader: `Convocation pour ${params.nomEleve}`,
    title: "Convocation",
    greeting: params.prenomTuteur?.trim() || undefined,
    bodyHtml: `
      <p style="margin:0 0 14px">Vous êtes convoqué(e) concernant <strong>${escapeHtml(params.nomEleve)}</strong> (${escapeHtml(params.classe)}).</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-radius:16px;background:${BRAND.canvas};border:1px solid ${BRAND.border}">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;color:${BRAND.ink}">
            <div style="margin:0 0 8px"><span style="color:${BRAND.muted}">Date</span><br /><strong>${escapeHtml(params.dateLabel)}</strong></div>
            <div><span style="color:${BRAND.muted}">Motif</span><br /><strong>${escapeHtml(params.motif)}</strong></div>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:${BRAND.muted};font-size:14px">Le détail est aussi disponible dans l’application EduParent.</p>
    `,
    cta: { label: "Ouvrir EduParent", href: appUrl() },
  });
  return {
    subject: `Convocation — ${params.nomEleve}`,
    text: `Convocation pour ${params.nomEleve} (${params.classe}).\nDate : ${params.dateLabel}\nMotif : ${params.motif}\n`,
    html,
  };
}

