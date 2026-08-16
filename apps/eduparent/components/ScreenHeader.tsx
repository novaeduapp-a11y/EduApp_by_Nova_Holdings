import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/lib/theme";

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.backText}>Retour</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  back: { minHeight: 44, justifyContent: "center" },
  backText: { color: colors.primary, fontWeight: "600", fontSize: 16 },
  title: { flex: 1, fontSize: 22, fontWeight: "700", color: colors.text },
});
