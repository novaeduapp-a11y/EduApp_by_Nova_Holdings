import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/BrandLockup";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";
import { NOVA_CONTACT } from "@/lib/contact";

export default function MotDePasseOublieScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour à la connexion"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.back, pressStyle(pressed, reduceMotion)]}
      >
        <Text style={[styles.backText, font.semibold]}>Connexion</Text>
      </Pressable>

      <View style={styles.body}>
        <BrandLogo brand="eduapps" size="lg" />
        <Text style={[styles.title, font.bold]}>Mot de passe oublié</Text>
        <Text style={[styles.lead, font.regular]}>
          Les comptes parents sont créés par l’établissement scolaire. Pour réinitialiser votre mot de passe,
          contactez la direction ou la secrétariat de l’école de votre enfant.
        </Text>
        <Text style={[styles.lead, font.regular]}>
          Vous pouvez aussi joindre l’équipe NOVA HOLDINGS si l’établissement vous a orienté vers nous.
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Appeler ${NOVA_CONTACT.phone}`}
            onPress={() => Linking.openURL(NOVA_CONTACT.phoneHref).catch(() => undefined)}
            style={({ pressed }) => [styles.primary, pressStyle(pressed, reduceMotion)]}
          >
            <Text style={[styles.primaryText, font.bold]}>Appeler le support</Text>
            <Text style={[styles.primarySub, font.regular]}>{NOVA_CONTACT.phone}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Écrire à ${NOVA_CONTACT.email}`}
            onPress={() => Linking.openURL(NOVA_CONTACT.emailHref).catch(() => undefined)}
            style={({ pressed }) => [styles.secondary, pressStyle(pressed, reduceMotion)]}
          >
            <Text style={[styles.secondaryText, font.bold]}>Écrire un e-mail</Text>
            <Text style={[styles.secondarySub, font.regular]}>{NOVA_CONTACT.email}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  back: { minHeight: hit.min, justifyContent: "center", alignSelf: "flex-start" },
  backText: { fontSize: type.body, color: colors.primary },
  body: { flex: 1, justifyContent: "center", gap: 14, paddingBottom: 24 },
  title: { fontSize: 28, color: colors.text, letterSpacing: -0.5, marginTop: 8 },
  lead: { fontSize: type.body, color: colors.muted, lineHeight: 24 },
  actions: { gap: 10, marginTop: 10 },
  primary: {
    minHeight: 56,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    justifyContent: "center",
    gap: 2,
  },
  primaryText: { color: colors.white, fontSize: type.body },
  primarySub: { color: "rgba(255,255,255,0.82)", fontSize: type.meta },
  secondary: {
    minHeight: 56,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    justifyContent: "center",
    gap: 2,
  },
  secondaryText: { color: colors.text, fontSize: type.body },
  secondarySub: { color: colors.muted, fontSize: type.meta },
});
