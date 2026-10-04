import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

export function ChildFilterSheet({
  visible,
  onClose,
  cycles,
  cycle,
  onCycle,
  classes,
  classe,
  onClasse,
}: {
  visible: boolean;
  onClose: () => void;
  cycles: string[];
  cycle: string;
  onCycle: (value: string) => void;
  classes: string[];
  classe: string;
  onClasse: (value: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const active = Boolean(cycle || classe);

  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? "none" : "fade"} onRequestClose={onClose}>
      <View style={styles.frame}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le filtre" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Text style={[styles.title, font.bold]}>Filtrer</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressStyle(pressed, reduceMotion)]}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>
        <Text style={[styles.lead, font.regular]}>Afficher seulement certains enfants.</Text>

        {cycles.length > 1 ? (
          <View style={styles.section}>
            <Text style={[styles.kicker, font.medium]}>Cycle</Text>
            <Option label="Tous" selected={cycle === ""} onPress={() => onCycle("")} />
            {cycles.map((item) => (
              <Option key={item} label={item} selected={cycle === item} onPress={() => onCycle(cycle === item ? "" : item)} />
            ))}
          </View>
        ) : null}

        {classes.length > 1 ? (
          <View style={styles.section}>
            <Text style={[styles.kicker, font.medium]}>Classe</Text>
            <Option label="Toutes" selected={classe === ""} onPress={() => onClasse("")} />
            {classes.map((item) => (
              <Option
                key={item}
                label={item}
                selected={classe === item}
                onPress={() => onClasse(classe === item ? "" : item)}
              />
            ))}
          </View>
        ) : null}

        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Effacer les filtres"
            onPress={() => {
              onCycle("");
              onClasse("");
            }}
            style={({ pressed }) => [styles.reset, pressStyle(pressed, reduceMotion)]}
          >
            <Text style={[styles.resetText, font.semibold]}>Effacer</Text>
          </Pressable>
        ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReduceMotion();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && styles.optionOn, pressStyle(pressed, reduceMotion)]}
    >
      <Text style={[styles.optionLabel, font.semibold, selected && styles.optionLabelOn]}>{label}</Text>
      {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 32, 58, 0.45)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: type.heading, color: colors.text, letterSpacing: -0.3 },
  close: {
    width: hit.min,
    height: hit.min,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: -10,
  },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: -6 },
  section: { gap: 6 },
  kicker: { fontSize: type.meta, color: colors.muted, marginBottom: 2 },
  option: {
    minHeight: hit.min,
    borderRadius: radius.inner,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionOn: { backgroundColor: colors.tint },
  optionLabel: { fontSize: 15, color: colors.text },
  optionLabelOn: { color: colors.primary },
  reset: { minHeight: hit.min, alignItems: "center", justifyContent: "center" },
  resetText: { fontSize: 15, color: colors.primary },
});
