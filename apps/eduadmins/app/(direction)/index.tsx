import { PortalHome } from "@/components/PortalHome";

export default function DirectionHome() {
  return (
    <PortalHome
      title="Direction"
      roleLabel="Portail Direction"
      modules={["Bilan du jour", "Aperçu établissement", "Alertes", "Personnel", "Agenda"]}
    />
  );
}
