"use client";

import { StaffMessagesPage } from "@/components/eduadmins/staff-messages-page";

export default function PrefetMessagesPage() {
  return (
    <StaffMessagesPage
      title="Messagerie"
      subtitle="Échanges avec la direction et les professeurs de votre cycle"
      listUrl="/api/staff/prefet/messages"
      startPayloadKey="directeurId"
      myRole="PREFET"
      emptyListLabel="Aucune direction ni professeur de votre cycle."
      pickLabel="Choisissez la direction ou un professeur."
      placeholder="Votre message"
    />
  );
}
