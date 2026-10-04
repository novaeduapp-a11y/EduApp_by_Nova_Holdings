import { auth } from "@/lib/auth";
import { getHomePathForRole } from "@/lib/role-routes";
import { NextResponse } from "next/server";
import { adminOrigin, isAdminHostname, isPublicAppHostname } from "@/lib/hosts";

const publicRoutes = ["/", "/login", "/eduadmins", "/api/auth", "/api/mobile", "/api/parent", "/api/staff", "/api/admin", "/api/ecoles", "/api/public", "/api/bulletins/verifier", "/bulletins/verifier"];
const authRoutes = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  if (isAdminHostname(host)) {
    const path = nextUrl.pathname;
    const allowed =
      path === "/login" ||
      path.startsWith("/dashboard") ||
      path.startsWith("/api/auth") ||
      path.startsWith("/api/admin") ||
      path.startsWith("/api/staff");
    if (path === "/" || path.startsWith("/eduadmins") || path.startsWith("/prefet") || path.startsWith("/professeur") || path.startsWith("/directeur") || path.startsWith("/parent")) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (!allowed && !path.startsWith("/_next")) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (isLoggedIn && userRole && userRole !== "ADMIN" && (path.startsWith("/dashboard") || path === "/login")) {
      return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_APP_URL || "https://eduadmin.net"}/login`));
    }
  }

  if (isPublicAppHostname(host) && nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL(`${adminOrigin()}${nextUrl.pathname}${nextUrl.search}`));
  }

  const isPublicRoute = publicRoutes.some(
    (route) =>
      nextUrl.pathname === route ||
      nextUrl.pathname.startsWith("/api/auth") ||
      nextUrl.pathname.startsWith("/api/mobile") ||
      nextUrl.pathname.startsWith("/api/parent") ||
      nextUrl.pathname.startsWith("/api/staff") ||
      nextUrl.pathname.startsWith("/api/admin") ||
      nextUrl.pathname.startsWith("/api/ecoles") ||
      nextUrl.pathname.startsWith("/api/public") ||
      nextUrl.pathname.startsWith("/eduadmins")
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPrefetRoute = nextUrl.pathname.startsWith("/prefet");
  const isParentRoute = nextUrl.pathname.startsWith("/parent") && !nextUrl.pathname.startsWith("/parents");
  const isEleveRoute = nextUrl.pathname.startsWith("/eleve") && !nextUrl.pathname.startsWith("/eleves");
  const isProfesseurRoute = nextUrl.pathname.startsWith("/professeur");
  const isDirecteurRoute = nextUrl.pathname.startsWith("/directeur");
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard") || 
    nextUrl.pathname.startsWith("/eleves") ||
    nextUrl.pathname.startsWith("/classes") ||
    nextUrl.pathname.startsWith("/notes") ||
    nextUrl.pathname.startsWith("/bulletins") ||
    nextUrl.pathname.startsWith("/absences") ||
    nextUrl.pathname.startsWith("/matieres") ||
    nextUrl.pathname.startsWith("/utilisateurs") ||
    nextUrl.pathname.startsWith("/parametres") ||
    nextUrl.pathname.startsWith("/paiements") ||
    nextUrl.pathname.startsWith("/parents") ||
    nextUrl.pathname.startsWith("/appreciations");

  // Si l'utilisateur est connecté et essaie d'accéder à une page d'auth
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(getHomePathForRole(userRole), nextUrl));
  }

  // Rediriger les utilisateurs vers leur espace dédié
  if (isLoggedIn) {
    // Parent ne peut accéder qu'à /parent
    if (userRole === "PARENT" && (isDashboardRoute || isEleveRoute || isProfesseurRoute || isDirecteurRoute || isPrefetRoute)) {
      return NextResponse.redirect(new URL("/parent", nextUrl));
    }

    if (userRole === "ELEVE" && (isDashboardRoute || isParentRoute || isProfesseurRoute || isDirecteurRoute || isPrefetRoute)) {
      return NextResponse.redirect(new URL("/eleve", nextUrl));
    }

    if (userRole === "PROFESSEUR" && (isDashboardRoute || isParentRoute || isEleveRoute || isDirecteurRoute || isPrefetRoute)) {
      return NextResponse.redirect(new URL("/professeur", nextUrl));
    }

    if (userRole === "PREFET" && (isDashboardRoute || isParentRoute || isEleveRoute || isProfesseurRoute || isDirecteurRoute)) {
      return NextResponse.redirect(new URL("/prefet", nextUrl));
    }

    if (userRole === "DIRECTEUR" && (isDashboardRoute || isParentRoute || isEleveRoute || isProfesseurRoute || isPrefetRoute)) {
      return NextResponse.redirect(new URL("/directeur", nextUrl));
    }

    if (userRole === "ADMIN" && (isParentRoute || isEleveRoute || isProfesseurRoute || isDirecteurRoute || isPrefetRoute)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
