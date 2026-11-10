import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { formatNoteFr } from "@/lib/format";
import { colors, font, noteColor, noteSoft } from "@/lib/theme";

export function ScoreRing({
  value,
  max = 20,
  size = 84,
  decimals = 1,
}: {
  value: number | null;
  max?: number;
  size?: number;
  decimals?: number;
}) {
  const stroke = size >= 100 ? 10 : 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = value == null ? 0 : Math.max(0, Math.min(1, value / max));
  const color = noteColor(value);

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={noteSoft(value)} strokeWidth={stroke} fill="none" />
        {ratio > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        ) : null}
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, size >= 100 && styles.valueLg, font.bold, { color }]}>
          {value == null ? "—" : formatNoteFr(value, decimals)}
        </Text>
        <Text style={[styles.max, font.medium]}>/ {max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 22, fontVariant: ["tabular-nums"], letterSpacing: -0.5, lineHeight: 26 },
  valueLg: { fontSize: 26, lineHeight: 30 },
  max: { fontSize: 11, color: colors.muted },
});
