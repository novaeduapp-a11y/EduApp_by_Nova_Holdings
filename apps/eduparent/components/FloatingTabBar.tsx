import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { colors, font, hit, useReduceMotion } from "@/lib/theme";

const items: Record<string, { label: string; on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { label: "Accueil", on: "home", off: "home-outline" },
  notes: { label: "Notes", on: "bar-chart", off: "bar-chart-outline" },
  absences: { label: "Absences", on: "calendar", off: "calendar-outline" },
  bulletins: { label: "Bulletins", on: "document-text", off: "document-text-outline" },
  plus: { label: "Plus", on: "ellipsis-horizontal-circle", off: "ellipsis-horizontal-circle-outline" },
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const visible = state.routes.filter((route) => {
    const href = (descriptors[route.key].options as { href?: string | null }).href;
    return href !== null && items[route.name];
  });
  const activeKey = state.routes[state.index]?.key;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {Platform.OS === "ios" ? <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} /> : null}
      <View style={styles.tint} />
      <View style={styles.row}>
        {visible.map((route) => {
          const focused = route.key === activeKey;
          const meta = items[route.name];
          const badge = descriptors[route.key].options.tabBarBadge;
          return (
            <Animated.View
              key={route.key}
              layout={reduce ? undefined : LinearTransition.springify().damping(18).stiffness(240)}
              style={[styles.slot, focused && styles.slotOn]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={meta.label}
                onPress={() => {
                  const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) {
                    if (!reduce) Haptics.selectionAsync();
                    navigation.navigate(route.name, route.params);
                  }
                }}
                style={[styles.item, focused && styles.itemOn]}
              >
                <View>
                  <Ionicons
                    name={focused ? meta.on : meta.off}
                    size={22}
                    color={focused ? colors.primary : colors.muted}
                  />
                  {typeof badge === "number" && badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={[styles.badgeText, font.bold]}>{badge > 9 ? "9+" : badge}</Text>
                    </View>
                  ) : null}
                </View>
                {focused ? (
                  <Animated.Text
                    entering={reduce ? undefined : FadeIn.duration(180)}
                    exiting={reduce ? undefined : FadeOut.duration(120)}
                    numberOfLines={1}
                    style={[styles.label, font.bold]}
                  >
                    {meta.label}
                  </Animated.Text>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(18,32,58,0.08)",
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.98)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 4,
    zIndex: 1,
  },
  slot: { flex: 1, minWidth: hit.min },
  slotOn: { flex: 1.85 },
  item: {
    minHeight: 48,
    width: "100%",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  itemOn: { backgroundColor: colors.tint },
  label: { fontSize: 13, color: colors.primary },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 9 },
});
