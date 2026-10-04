import { NextResponse } from "next/server";

/** Ancienne liste publique — retirée : l’établissement se déduit des identifiants. */
export async function GET() {
  return NextResponse.json({ error: "Cette liste n’est plus publique" }, { status: 404 });
}
