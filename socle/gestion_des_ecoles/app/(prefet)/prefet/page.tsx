"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Accueil = {
  familleLabel: string;
  ecole: { nom: string; ville: string } | null;
  totalClasses: number;
  totalEleves: number;
  totalBulletins: number;
};

export default function PrefetHome() {
  const [data, setData] = useState<Accueil | null>(null);

  useEffect(() => {
    fetch("/api/staff/prefet/accueil")
      .then((res) => res.json())
      .then((body) => setData(body.data))
      .catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#1A5FD4] p-8 text-white">
        <p className="text-sm text-blue-100 mb-1">Portail Préfets · EduAdmins</p>
        <h1 className="text-3xl font-bold">Cycle {data?.familleLabel ?? "…"}</h1>
        <p className="mt-2 text-blue-100 max-w-xl">
          {data?.ecole ? `${data.ecole.nom} · ${data.ecole.ville}` : "Votre espace est isolé par cycle."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/prefet/eleves" className="rounded-2xl bg-white p-5 border border-[#D7E2F5]">
          <p className="text-3xl font-bold text-[#1A5FD4]">{data?.totalEleves ?? "—"}</p>
          <h2 className="font-semibold text-[#12203A] mt-1">Élèves</h2>
          <p className="text-sm text-[#5B6B86] mt-1">Inscriptions de votre cycle uniquement.</p>
        </Link>
        <Link href="/prefet/classes" className="rounded-2xl bg-white p-5 border border-[#D7E2F5]">
          <p className="text-3xl font-bold text-[#1A5FD4]">{data?.totalClasses ?? "—"}</p>
          <h2 className="font-semibold text-[#12203A] mt-1">Classes</h2>
          <p className="text-sm text-[#5B6B86] mt-1">Création limitée aux niveaux du cycle.</p>
        </Link>
        <Link href="/prefet/bulletins" className="rounded-2xl bg-white p-5 border border-[#D7E2F5]">
          <p className="text-3xl font-bold text-[#1A5FD4]">{data?.totalBulletins ?? "—"}</p>
          <h2 className="font-semibold text-[#12203A] mt-1">Bulletins</h2>
          <p className="text-sm text-[#5B6B86] mt-1">Génération PDF via le moteur du socle.</p>
        </Link>
      </div>
    </div>
  );
}
