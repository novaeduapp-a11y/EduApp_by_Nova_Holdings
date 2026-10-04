"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { portalLinkClass, portalMutedClass, portalPanelClass } from "@/components/eduadmins/portal-shell";

export default function ParametresParentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-balance text-[30px] font-bold leading-9 tracking-tight">Paramètres</h1>
        <p className={`${portalMutedClass} mt-1`}>
          Le compte, le mot de passe et l’authentification se gèrent dans le profil.
        </p>
      </div>

      <section className={portalPanelClass}>
        <h2 className="font-bold tracking-tight text-foreground">Compte</h2>
        <p className={`${portalMutedClass} mt-1`}>
          Mettez à jour votre nom, e-mail, mot de passe et la connexion en deux étapes.
        </p>
        <Button asChild className="mt-4">
          <Link href="/parent/profil">Ouvrir le profil</Link>
        </Button>
      </section>

      <section className={portalPanelClass}>
        <h2 className="font-bold tracking-tight text-foreground">Notifications</h2>
        <p className={`${portalMutedClass} mt-1`}>
          Les communiqués, notes et messages des professeurs apparaissent dans{" "}
          <Link href="/parent/alertes" className={portalLinkClass}>
            Alertes
          </Link>
          . L’e-mail et le SMS ne sont pas encore branchés.
        </p>
      </section>
    </div>
  );
}
