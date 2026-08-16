import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, portails } from "@/lib/theme";

export default function PortailsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>EduAdmins</Text>
      <Text style={styles.sub}>NOVA HOLDINGS · Dakar</Text>
      <Text style={styles.lead}>Choisissez votre portail pour continuer.</Text>
      {portails.map((portail) => (
        <Pressable
          key={portail.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/login", params: { portail: portail.id } })}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.cardTitle}>{portail.title}</Text>
          <Text style={styles.cardText}>{portail.text}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 72, gap: 14 },
  brand: { fontSize: 28, fontWeight: "700", color: colors.primary },
  sub: { fontSize: 14, color: colors.muted, marginBottom: 8 },
  lead: { fontSize: 18, color: colors.text, marginBottom: 8, lineHeight: 26 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
    justifyContent: "center",
    gap: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  cardText: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
