import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

const FALLBACK = "Impossible de charger. Vérifiez votre connexion et réessayez.";

export function LoadError({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry: () => void;
}) {
  const reduceMotion = useReduceMotion();
  return (
    <View style={styles.box}>
      <Text accessibilityRole="alert" style={[styles.message, font.regular]}>
        {message?.trim() || FALLBACK}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Réessayer"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressStyle(pressed, reduceMotion)]}
      >
        <Text style={[styles.retryText, font.bold]}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

export function loadErrorMessage(err: unknown, fallback = FALLBACK) {
  return err instanceof Error && err.message.trim() ? err.message : fallback;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.failSoft,
    borderRadius: radius.inner,
    padding: 14,
    gap: 8,
  },
  message: { color: colors.fail, fontSize: type.body, lineHeight: 22 },
  retry: {
    minHeight: hit.min,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  retryText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
