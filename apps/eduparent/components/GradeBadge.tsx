import { StyleSheet, Text, View } from "react-native";
import { font, noteColor, noteSoft } from "@/lib/theme";

export function GradeBadge({
  value,
  label,
  size = "md",
  accessibilityLabel,
}: {
  value: number | null;
  label?: string;
  size?: "md" | "lg";
  accessibilityLabel?: string;
}) {
  const text = label ?? (value == null ? "—" : String(value));
  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.badge, size === "lg" && styles.lg, { backgroundColor: noteSoft(value) }]}
    >
      <Text style={[styles.text, size === "lg" && styles.lgText, font.bold, { color: noteColor(value) }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 48,
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lg: { minWidth: 64, height: 44, borderRadius: 12 },
  text: { fontSize: 16, fontVariant: ["tabular-nums"] },
  lgText: { fontSize: 20, letterSpacing: -0.4 },
});
