import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, type Href } from "expo-router";
import { ChildSwitcher } from "@/components/ChildSwitcher";
import { useSession } from "@/context/session";
import { colors, font, pressStyle, useReduceMotion } from "@/lib/theme";

export function PortalHeader({
  switchChild = true,
  subtitle,
}: {
  switchChild?: boolean;
  subtitle?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { user, unreadCount } = useSession();
  const display = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Parent";

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={[styles.kicker, font.medium]}>ESPACE PARENT</Text>
          <Text style={[styles.name, font.bold]} numberOfLines={1}>
            {display}
          </Text>
          {subtitle ? (
            <Text style={[styles.sub, font.regular]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Notifications"
            }
            onPress={() => router.push("/notifications" as Href)}
            style={({ pressed }) => [styles.iconBtn, pressStyle(pressed, reduceMotion)]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {unreadCount > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Paramètres"
            onPress={() => router.push("/parametres" as Href)}
            style={({ pressed }) => [styles.iconBtn, pressStyle(pressed, reduceMotion)]}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>
      {switchChild ? <ChildSwitcher variant="cards" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, marginBottom: 4 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  copy: { flex: 1, gap: 2 },
  kicker: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fail,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
