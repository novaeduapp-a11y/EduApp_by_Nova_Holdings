"use client";

import { StaffMessagesPage } from "@/components/eduadmins/staff-messages-page";

export default function PrefetMessagesPage() {
  return (
    <StaffMessagesPage
      title="Messagerie"
      subtitle="Échanges avec la direction de votre établissement"
      listUrl="/api/staff/prefet/messages"
      startPayloadKey="directeurId"
      myRole="PREFET"
      emptyListLabel="Aucun directeur actif dans votre établissement."
      pickLabel="Choisissez la direction dans la liste."
      placeholder="Votre message à la direction"
    />
  );
}
