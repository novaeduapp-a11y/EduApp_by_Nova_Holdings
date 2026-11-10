import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/lib/theme";

/** Placeholder de chargement — sans Reanimated (crash iOS TestFlight). */
export function Skeleton({ height = 92, count = 1 }: { height?: number; count?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.block, { height }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  block: { backgroundColor: colors.tint, borderRadius: radius.card, opacity: 0.85 },
});
