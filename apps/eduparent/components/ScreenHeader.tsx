import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, font, hit, pressStyle, type as typeScale, useReduceMotion } from "@/lib/theme";

export function ScreenHeader({ title, showBack = true }: { title: string; showBack?: boolean }) {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressStyle(pressed, reduceMotion)]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      ) : null}
      <Text style={[styles.title, font.bold]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: hit.min },
  back: {
    width: hit.min,
    height: hit.min,
    marginStart: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: typeScale.heading,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
});
