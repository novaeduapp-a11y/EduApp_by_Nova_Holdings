"use client";

import { StaffMessagesPage } from "@/components/eduadmins/staff-messages-page";

export default function DirecteurMessagesPage() {
  return (
    <StaffMessagesPage
      title="Messagerie"
      subtitle="Échanges avec les préfets de votre établissement"
      listUrl="/api/staff/direction/messages"
      startPayloadKey="prefetId"
      myRole="DIRECTEUR"
      emptyListLabel="Aucun préfet actif dans votre établissement."
      pickLabel="Choisissez un préfet dans la liste."
      placeholder="Votre message au préfet"
    />
  );
}
