import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/context/session";
import { colors } from "@/lib/theme";

export default function PlusScreen() {
  const { user, logout } = useSession();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Plus</Text>
      <Text style={styles.muted}>
        {user ? `${user.prenom} ${user.nom}` : "Professeur"}
        {user?.ecole ? ` · ${user.ecole.nom}` : ""}
      </Text>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Compte</Text>
        <Text style={styles.item}>{user?.email}</Text>
        <Text style={styles.item}>
          {user?.typeProfesseur === "PRIMAIRE" ? "Instituteur (toutes les matières de sa classe)" : "Professeur de matière"}
        </Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>À venir</Text>
        <Text style={styles.item}>Planning personnel (EDT)</Text>
        <Text style={styles.item}>Messagerie parents de vos élèves</Text>
        <Text style={styles.item}>Alertes en lecture</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => logout()} style={styles.out}>
        <Text style={styles.outText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40, gap: 10 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  muted: { color: colors.muted, fontSize: 15 },
  panel: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginTop: 6,
  },
  panelTitle: { fontWeight: "700", color: colors.text, fontSize: 16 },
  item: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  out: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  outText: { color: colors.fail, fontWeight: "600", fontSize: 16 },
});
