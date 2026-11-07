"use client";

import { StaffMessagesPage } from "@/components/eduadmins/staff-messages-page";

export default function DirecteurMessagesPage() {
  return (
    <StaffMessagesPage
      title="Messagerie"
      subtitle="Échanges avec le personnel de votre établissement (préfets et professeurs)"
      listUrl="/api/staff/direction/messages"
      startPayloadKey="prefetId"
      myRole="DIRECTEUR"
      emptyListLabel="Aucun membre du personnel actif dans votre établissement."
      pickLabel="Choisissez un interlocuteur dans la liste."
      placeholder="Votre message au personnel"
    />
  );
}
