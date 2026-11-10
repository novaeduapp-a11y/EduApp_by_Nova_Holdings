import { storageGet, storageSet } from "@/lib/storage";

export const ONBOARDING_KEY = "eduparent.onboarding.done";

/** Cache mémoire pour éviter le rebond Guard → /bienvenue juste après « Passer / Commencer ». */
let memoryDone = false;

export async function readOnboardingDone(): Promise<boolean> {
  if (memoryDone) return true;
  const value = await storageGet(ONBOARDING_KEY);
  memoryDone = value === "1";
  return memoryDone;
}

export async function completeOnboarding(): Promise<void> {
  memoryDone = true;
  await storageSet(ONBOARDING_KEY, "1");
}
