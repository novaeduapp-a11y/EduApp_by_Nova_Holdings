import { NextResponse } from "next/server";
import { requireParent } from "@/lib/request-auth";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/** PDF parent désactivé tant que les bulletins ne sont pas signés. */
export async function GET() {
  const authResult = await requireParent();
  if (!authResult.ok) return authResult.response;

  return NextResponse.json(
    {
      error:
        "Le téléchargement PDF n’est pas encore disponible. Consultez le bulletin dans l’application.",
    },
    { status: 403 }
  );
}
