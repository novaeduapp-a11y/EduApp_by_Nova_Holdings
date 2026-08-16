import { auth } from "@/lib/auth";
import { getHomePathForRole } from "@/lib/role-routes";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/api/auth", "/api/bulletins/verifier", "/bulletins/verifier"];
const authRoutes = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/api/auth")
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
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
    if (userRole === "PARENT" && (isDashboardRoute || isEleveRoute || isProfesseurRoute || isDirecteurRoute)) {
      return NextResponse.redirect(new URL("/parent", nextUrl));
    }

    // Élève ne peut accéder qu'à /eleve
    if (userRole === "ELEVE" && (isDashboardRoute || isParentRoute || isProfesseurRoute || isDirecteurRoute)) {
      return NextResponse.redirect(new URL("/eleve", nextUrl));
    }

    // Professeur ne peut accéder qu'à /professeur
    if (userRole === "PROFESSEUR" && (isDashboardRoute || isParentRoute || isEleveRoute || isDirecteurRoute)) {
      return NextResponse.redirect(new URL("/professeur", nextUrl));
    }

    // Directeur : accès au back-office + /directeur, pas aux autres portails
    if (userRole === "DIRECTEUR" && (isParentRoute || isEleveRoute || isProfesseurRoute)) {
      return NextResponse.redirect(new URL("/directeur", nextUrl));
    }

    // Admin peut accéder au dashboard, mais pas aux espaces dédiés
    if (userRole === "ADMIN" && (isParentRoute || isEleveRoute || isProfesseurRoute || isDirecteurRoute)) {
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
