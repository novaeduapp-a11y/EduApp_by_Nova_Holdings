import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

/** Back-office socle (admin) + APIs notes héritées du professeur. Direction / préfet ont leurs propres APIs. */
export const STAFF_ROLES: Role[] = ["ADMIN", "PROFESSEUR"];

/** Inscriptions, finances, imports : réservé à l’admin socle. */
export const MANAGEMENT_ROLES: Role[] = ["ADMIN"];

export const ADMIN_ROLES: Role[] = ["ADMIN"];

type AuthSuccess = { ok: true; session: Session };
type AuthFailure = { ok: false; response: NextResponse };
export type AuthResult = AuthSuccess | AuthFailure;

function unauthorized(): AuthFailure {
  return {
    ok: false,
    response: NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Non autorisé" } },
      { status: 401 }
    ),
  };
}

function forbidden(): AuthFailure {
  return {
    ok: false,
    response: NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Permission refusée" } },
      { status: 403 }
    ),
  };
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  return { ok: true, session };
}

export async function requireRoles(allowedRoles: readonly Role[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;
  if (!allowedRoles.includes(result.session.user.role)) {
    return forbidden();
  }
  return result;
}

export const requireStaff = () => requireRoles(STAFF_ROLES);
export const requireManagement = () => requireRoles(MANAGEMENT_ROLES);
export const requireAdmin = () => requireRoles(ADMIN_ROLES);
