import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Rechercher…",
  accessibilityLabel = "Rechercher",
  light = false,
  inset = false,
  onFilterPress,
  filterActive = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  light?: boolean;
  inset?: boolean;
  onFilterPress?: () => void;
  filterActive?: boolean;
}) {
  const reduceMotion = useReduceMotion();
  const icon = light ? "rgba(255,255,255,0.78)" : colors.muted;

  return (
    <View style={[styles.wrap, light && styles.wrapLight, inset && styles.wrapInset]}>
      <Ionicons name="search-outline" size={18} color={icon} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={light ? "rgba(255,255,255,0.62)" : colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={[styles.input, font.regular, light && styles.inputLight]}
      />
      {onFilterPress ? (
        <>
          <View style={[styles.sep, light && styles.sepLight]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filterActive ? "Modifier le filtre" : "Filtrer"}
            accessibilityState={{ selected: filterActive }}
            onPress={onFilterPress}
            hitSlop={4}
            style={({ pressed }) => [
              styles.filter,
              filterActive && (light ? styles.filterOnLight : styles.filterOn),
              pressStyle(pressed, reduceMotion),
            ]}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={filterActive ? (light ? colors.primary : colors.white) : icon}
            />
            {filterActive ? <View style={[styles.dot, light && styles.dotLight]} /> : null}
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: hit.min,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingEnd: 6,
    borderRadius: radius.control,
    backgroundColor: colors.white,
  },
  wrapLight: { backgroundColor: "rgba(255,255,255,0.16)" },
  wrapInset: { backgroundColor: colors.background },
  input: {
    flex: 1,
    minHeight: hit.min,
    fontSize: type.body,
    color: colors.text,
    paddingVertical: 8,
  },
  inputLight: { color: colors.white },
  sep: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: colors.border,
  },
  sepLight: { backgroundColor: "rgba(255,255,255,0.28)" },
  filter: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterOn: { backgroundColor: colors.primary },
  filterOnLight: { backgroundColor: colors.white },
  dot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  dotLight: { backgroundColor: colors.primary },
});
