import { StaffProfil } from "@/components/eduadmins/staff-profil";

export default function ProfilParentPage() {
  return (
    <StaffProfil
      mePath="/api/parent/compte"
      passwordPath="/api/parent/compte/password"
      twoFaPath="/api/parent/compte/2fa"
    />
  );
}
