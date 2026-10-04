import { redirect } from "next/navigation";

/** La liste publique d’établissements n’est plus exposée : on identifie l’école par les identifiants. */
export default function EduAdminsEcolesRedirect() {
  redirect("/login");
}
