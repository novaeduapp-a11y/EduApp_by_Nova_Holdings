/** Coordonnées support NOVA HOLDINGS (écran Compte, aide). */
export const NOVA_CONTACT = {
  phones: [
    { label: "+221 76 796 85 61", href: "tel:+221767968561" },
    { label: "+1 (901) 292-3422", href: "tel:+19012923422" },
  ],
  /** @deprecated Prefer phones[] — kept for appels directs au 1er numéro. */
  phone: "+221 76 796 85 61",
  phoneHref: "tel:+221767968561",
  email: "contact@eduadmin.net",
  emailHref: "mailto:contact@eduadmin.net",
} as const;

export const EDUADMIN_CONTACT = {
  phones: [
    { label: "+221 76 796 85 61", href: "tel:+221767968561" },
    { label: "+1 (901) 292-3422", href: "tel:+19012923422" },
  ],
  email: "contact@eduadmin.net",
  emailHref: "mailto:contact@eduadmin.net",
} as const;

export const LEGAL_URLS = {
  conditions: "https://novaholdings.net/conditions.html",
  confidentialite: "https://novaholdings.net/confidentialite.html",
} as const;
