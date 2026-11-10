import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font, hit } from "@/lib/theme";

/** Minimal tab-bar props — avoids a hard dependency on @react-navigation/bottom-tabs. */
type FloatingTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
  descriptors: Record<
    string,
    { options: { href?: string | null; tabBarBadge?: number | string } }
  >;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
};

const items: Record<
  string,
  { label: string; on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: "Accueil", on: "home", off: "home-outline" },
  notes: { label: "Notes", on: "bar-chart", off: "bar-chart-outline" },
  edt: { label: "Emploi", on: "calendar", off: "calendar-outline" },
  messagerie: { label: "Messages", on: "chatbubble-ellipses", off: "chatbubble-ellipses-outline" },
};

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
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
          const tint = focused ? colors.primary : colors.muted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={styles.item}
            >
              <View style={[styles.iconPill, focused && styles.iconPillOn]}>
                <Ionicons name={focused ? meta.on : meta.off} size={22} color={tint} />
                {typeof badge === "number" && badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, font.bold]}>{badge > 9 ? "9+" : badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={[styles.label, focused ? font.bold : font.medium, { color: tint }]}>
                {meta.label}
              </Text>
            </Pressable>
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
    ...StyleSheet.absoluteFill,
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.98)",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    minHeight: hit.min,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconPill: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillOn: { backgroundColor: colors.tint },
  badge: {
    position: "absolute",
    top: -2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.fail,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, color: colors.white },
  label: { fontSize: 11 },
});
