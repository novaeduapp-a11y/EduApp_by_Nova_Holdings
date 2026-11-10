import { Image, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/lib/theme";

export function Avatar({
  photo,
  name,
  label,
  size = 44,
  light = false,
  tone,
}: {
  photo?: string | null;
  name: string;
  label?: string;
  size?: number;
  light?: boolean;
  tone?: { fg: string; bg: string };
}) {
  const text = label ?? (name.trim().charAt(0).toUpperCase() || "?");
  const box = { width: size, height: size, borderRadius: size / 2 };
  const bg = tone?.bg ?? (light ? "rgba(255,255,255,0.18)" : colors.tint);
  const fg = tone?.fg ?? (light ? colors.white : colors.primary);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, box, { backgroundColor: bg }]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={[box, styles.image]} />
      ) : (
        <Text style={[font.bold, { fontSize: size * (text.length > 1 ? 0.36 : 0.42), color: fg }]}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
});
