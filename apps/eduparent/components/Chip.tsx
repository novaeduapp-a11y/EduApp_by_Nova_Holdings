import { Pressable, StyleSheet, Text } from "react-native";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

export function Chip({
  label,
  selected,
  onPress,
  compact,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const reduceMotion = useReduceMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.compact,
        selected && styles.active,
        pressStyle(pressed, reduceMotion),
      ]}
    >
      <Text style={[styles.text, font.semibold, selected && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: hit.min,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    justifyContent: "center",
  },
  compact: { flex: 1, paddingHorizontal: 0, alignItems: "center" },
  active: { backgroundColor: colors.primary },
  text: { fontSize: type.meta, fontWeight: "600", color: colors.text },
  textActive: { color: colors.white },
});
