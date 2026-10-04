import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, type TextStyle, type ViewStyle } from "react-native";

export const colors = {
  primary: "#1A5FD4",
  primaryDeep: "#0B2F7A",
  primarySoft: "#4F8CFF",
  background: "#EEF3FF",
  white: "#FFFFFF",
  text: "#12203A",
  muted: "#5B6B86",
  border: "#D7E2F5",
  tint: "#E8F0FE",
  good: "#1A5FD4",
  passable: "#3D6FBF",
  fail: "#C62828",
  failSoft: "#FDECEC",
} as const;

export const fonts = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
} as const;

export const radius = {
  card: 24,
  inner: 14,
  control: 16,
  pill: 999,
} as const;

export const space = {
  screen: 20,
  group: 10,
  section: 18,
} as const;

export const type = {
  title: 30,
  heading: 22,
  body: 16,
  meta: 13,
} as const;

export const hit = {
  min: 44,
} as const;

export const motion = {
  pressScale: 0.96,
} as const;

export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#0B2F7A",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 5 },
    default: {
      boxShadow: "0 0 0 1px rgba(11,47,122,0.05), 0 12px 32px rgba(11,47,122,0.12)",
    },
  }) ?? {},
  bar: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#0B2F7A",
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: { elevation: 10 },
    default: {
      boxShadow: "0 -8px 24px rgba(11,47,122,0.08)",
    },
  }) ?? {},
  float: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#0B2F7A",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
    },
    android: { elevation: 12 },
    default: {
      boxShadow: "0 16px 40px rgba(11,47,122,0.18)",
    },
  }) ?? {},
} as const;

export const cardSurface: ViewStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.card,
  padding: 16,
  ...shadow.card,
};

export const font = {
  regular: { fontFamily: fonts.regular } as TextStyle,
  medium: { fontFamily: fonts.medium } as TextStyle,
  semibold: { fontFamily: fonts.semibold } as TextStyle,
  bold: { fontFamily: fonts.bold } as TextStyle,
};

export function greeting(hour = new Date().getHours()): string {
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function noteColor(value: number | null): string {
  if (value == null) return colors.muted;
  if (value >= 14) return colors.good;
  if (value >= 10) return colors.passable;
  return colors.fail;
}

export function noteLabel(value: number | null): string {
  if (value == null) return "Non noté";
  if (value >= 14) return "Bien";
  if (value >= 10) return "Passable";
  return "À renforcer";
}

export function pressStyle(pressed: boolean, reduceMotion = false) {
  return pressed && !reduceMotion ? { transform: [{ scale: motion.pressScale }] as const } : undefined;
}

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}
