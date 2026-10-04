import { StyleSheet, TextInput, View } from "react-native";
import { colors } from "@/lib/theme";

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Rechercher un élève…",
  accessibilityLabel = "Rechercher un élève",
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.wrap}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  input: {
    minHeight: 44,
    fontSize: 16,
    color: colors.text,
  },
});
