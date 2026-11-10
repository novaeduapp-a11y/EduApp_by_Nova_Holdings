import { Image, StyleSheet, View } from "react-native";
import {
  ONBOARDING_IMAGES,
  type OnboardingImageKind,
} from "@/lib/onboarding-images";
import { colors, radius } from "@/lib/theme";

const SIZE = 300;

/** Photo réelle pour les slides d’onboarding. */
export function OnboardingArt({ kind }: { kind: OnboardingImageKind; active?: boolean }) {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.card}>
        <Image source={ONBOARDING_IMAGES[kind]} style={styles.image} resizeMode="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  card: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.card + 10,
    overflow: "hidden",
    backgroundColor: colors.white,
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  image: { width: "100%", height: "100%" },
});
