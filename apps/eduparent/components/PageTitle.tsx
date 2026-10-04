import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChildSwitcher } from "@/components/ChildSwitcher";
import { colors, font, hit, pressStyle, type, useReduceMotion } from "@/lib/theme";

export function PageTitle({
  title,
  subtitle,
  switchChild = false,
  showBack = false,
}: {
  title: string;
  subtitle?: string;
  switchChild?: boolean;
  showBack?: boolean;
}) {
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
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
        <Text style={[styles.title, font.bold, showBack && styles.titleWithBack]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {subtitle ? <Text style={[styles.sub, font.regular]}>{subtitle}</Text> : null}
      {switchChild ? <ChildSwitcher /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginBottom: 4 },
  head: { flexDirection: "row", alignItems: "center", minHeight: 36 },
  back: {
    width: hit.min,
    height: hit.min,
    marginStart: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: type.title,
    color: colors.text,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  titleWithBack: { flex: 1 },
  sub: { fontSize: type.body, color: colors.muted, lineHeight: 22 },
});
