export function publicOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://eduadmin.net").replace(/\/$/, "");
}

export function adminOrigin() {
  return (process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.eduadmin.net").replace(/\/$/, "");
}

export function hostnameFromRequest(request: { headers: Headers }) {
  const raw =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return raw.split(",")[0].trim().split(":")[0].toLowerCase();
}

export function isAdminHostname(host: string) {
  const expected = adminOrigin().replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  return Boolean(host) && host === expected && !host.includes("localhost");
}

export function isPublicAppHostname(host: string) {
  return host === "eduadmin.net" || host === "www.eduadmin.net";
}

export function adminLoginHref() {
  const admin = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "");
  if (!admin) return "/login";
  return `${admin}/login`;
}
