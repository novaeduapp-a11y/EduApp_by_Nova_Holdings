import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { cardSurface, colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

export function NavRow({
  icon,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const reduceMotion = useReduceMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressStyle(pressed, reduceMotion)]}
    >
      <View style={styles.iconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, font.bold]}>{title}</Text>
        <Text style={[styles.sub, font.regular]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    ...cardSurface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    paddingVertical: 14,
  },
  iconWrap: {
    width: hit.min,
    height: hit.min,
    borderRadius: radius.inner,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: type.body, fontWeight: "700", color: colors.text },
  sub: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
