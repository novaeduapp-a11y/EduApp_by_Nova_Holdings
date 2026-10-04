import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, useReduceMotion } from "@/lib/theme";

export function Skeleton({ height = 92, count = 1 }: { height?: number; count?: number }) {
  const reduce = useReduceMotion();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (reduce) return;
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [opacity, reduce]);

  const pulse = useAnimatedStyle(() => ({ opacity: reduce ? 1 : opacity.value }));

  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.block, { height }, pulse]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  block: { backgroundColor: colors.tint, borderRadius: radius.card },
});
