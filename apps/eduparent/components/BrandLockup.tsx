import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, font } from "@/lib/theme";

/** PNG carrés 1024×1024 — on affiche en format carré pour remplir l’espace. */
const SIZES = {
  sm: 56,
  md: 76,
  lg: 100,
  xl: 124,
  hero: 152,
} as const;

export type BrandSize = keyof typeof SIZES;

type BrandLockupProps = {
  show?: "eduapps" | "nova" | "both";
  layout?: "stacked" | "row";
  size?: BrandSize;
  style?: ViewStyle;
};

const SOURCES = {
  eduapps: require("@/assets/eduapps-logo.png"),
  nova: require("@/assets/nova-logo.png"),
} as const;

const LABELS = {
  eduapps: "EduApps",
  nova: "NOVA HOLDINGS",
} as const;

export function BrandLogo({
  brand,
  size = "md",
  style,
}: {
  brand: keyof typeof SOURCES;
  size?: BrandSize;
  style?: ViewStyle;
}) {
  const side = SIZES[size];
  return (
    <Image
      source={SOURCES[brand]}
      accessibilityLabel={LABELS[brand]}
      resizeMode="contain"
      style={[{ width: side, height: side }, style]}
    />
  );
}

export function BrandLockup({
  show = "both",
  layout = "stacked",
  size = "md",
  style,
}: BrandLockupProps) {
  return (
    <View style={[layout === "row" ? styles.row : styles.stack, style]}>
      {show !== "nova" ? <BrandLogo brand="eduapps" size={size} /> : null}
      {show === "both" ? (
        <View style={[styles.divider, layout === "row" ? styles.dividerRow : styles.dividerStack]} />
      ) : null}
      {show !== "eduapps" ? <BrandLogo brand="nova" size={size} /> : null}
    </View>
  );
}

export function BrandFooter({ version }: { version?: string }) {
  return (
    <View style={styles.footer}>
      <BrandLogo brand="nova" size="lg" />
      <Text style={[styles.footerLine, font.regular]}>Une solution NOVA HOLDINGS</Text>
      <Text style={[styles.footerMeta, font.regular]}>EduParent · suivi scolaire pour les familles</Text>
      {version ? <Text style={[styles.footerMeta, font.regular]}>Version {version}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { alignItems: "center", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  divider: { backgroundColor: colors.border },
  dividerStack: { width: 56, height: 1 },
  dividerRow: { width: 1, height: 36 },
  footer: { alignItems: "center", gap: 10, paddingVertical: 6 },
  footerLine: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },
  footerMeta: { fontSize: 13, color: colors.muted, textAlign: "center" },
});
