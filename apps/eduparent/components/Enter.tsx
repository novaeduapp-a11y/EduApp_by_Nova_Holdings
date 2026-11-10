import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

/** Conteneur d’entrée — volontairement sans Reanimated (crash iOS TestFlight). */
export function Enter({
  children,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={style}>{children}</View>;
}
