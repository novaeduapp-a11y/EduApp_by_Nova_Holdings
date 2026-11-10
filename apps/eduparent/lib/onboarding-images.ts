export const ONBOARDING_IMAGES = {
  notes: require("@/assets/onboarding/notes.jpg"),
  temps: require("@/assets/onboarding/temps.jpg"),
  messages: require("@/assets/onboarding/messages.jpg"),
} as const;

export type OnboardingImageKind = keyof typeof ONBOARDING_IMAGES;

export const ONBOARDING_IMAGE_KINDS = Object.keys(ONBOARDING_IMAGES) as OnboardingImageKind[];

export function pickRandomOnboardingImage(): OnboardingImageKind {
  const index = Math.floor(Math.random() * ONBOARDING_IMAGE_KINDS.length);
  return ONBOARDING_IMAGE_KINDS[index] ?? "notes";
}
