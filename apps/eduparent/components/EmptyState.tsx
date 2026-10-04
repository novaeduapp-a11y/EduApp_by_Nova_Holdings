import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, radius, shadow, type } from "@/lib/theme";

export function EmptyState({
  icon = "information-circle-outline",
  title,
  body,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.title, font.bold]}>{title}</Text>
      <Text style={[styles.body, font.regular]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 24,
    alignItems: "center",
    gap: 8,
    ...shadow.card,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: type.body, fontWeight: "700", color: colors.text, textAlign: "center" },
  body: { fontSize: 15, color: colors.muted, lineHeight: 22, textAlign: "center" },
});
