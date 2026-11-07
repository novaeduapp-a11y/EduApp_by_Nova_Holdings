import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://eduadmin.net").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/eduadmins", "/app"],
        disallow: [
          "/api/",
          "/dashboard",
          "/login",
          "/prefet",
          "/professeur",
          "/directeur",
          "/parent",
          "/eleve",
          "/eleves",
          "/classes",
          "/notes",
          "/bulletins",
          "/absences",
          "/matieres",
          "/utilisateurs",
          "/parametres",
          "/paiements",
          "/parents",
          "/appreciations",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
