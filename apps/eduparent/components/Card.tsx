import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { cardSurface, pressStyle, useReduceMotion } from "@/lib/theme";

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityState,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
}) {
  const reduceMotion = useReduceMotion();

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressStyle(pressed, reduceMotion)]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: cardSurface,
});
