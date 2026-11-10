import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, type } from "@/lib/theme";

export function SectionHead({
  icon,
  title,
  action,
  chevron = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  action?: string;
  chevron?: boolean;
}) {
  return (
    <View style={styles.head}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.title, font.bold]} numberOfLines={1}>
        {title}
      </Text>
      {action ? <Text style={[styles.action, font.semibold]}>{action}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={colors.muted} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: type.body, color: colors.text },
  action: { fontSize: 13, color: colors.muted },
});
