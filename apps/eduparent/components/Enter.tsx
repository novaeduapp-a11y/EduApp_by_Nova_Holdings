import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useReduceMotion } from "@/lib/theme";

export function Enter({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  if (reduce) return <View style={style}>{children}</View>;
  return (
    <Animated.View
      entering={FadeInDown.duration(520)
        .delay(index * 90)
        .springify()
        .damping(18)
        .stiffness(180)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
