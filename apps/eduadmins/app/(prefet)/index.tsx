import { PortalHome } from "@/components/PortalHome";

export default function PrefetHome() {
  return (
    <PortalHome
      title="Espace préfet"
      roleLabel="Portail Préfets"
      modules={["Inscriptions du cycle", "Classes", "Bulletins PDF", "EDT hebdo", "Communiqués"]}
    />
  );
}
