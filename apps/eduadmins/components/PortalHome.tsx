import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/context/session";
import { colors } from "@/lib/theme";

export function PortalHome({
  title,
  roleLabel,
  modules,
}: {
  title: string;
  roleLabel: string;
  modules: string[];
}) {
  const { user, logout } = useSession();
  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>{roleLabel}</Text>
      <Text style={styles.title}>
        {title}
        {user?.prenom ? ` · ${user.prenom}` : ""}
      </Text>
      {user?.ecole ? (
        <Text style={styles.meta}>
          {user.ecole.nom} · {user.ecole.ville}
        </Text>
      ) : null}
      {user?.familleCycle ? <Text style={styles.meta}>Cycle {user.familleCycle.toLowerCase()}</Text> : null}
      {user?.typeProfesseur ? (
        <Text style={styles.meta}>{user.typeProfesseur === "PRIMAIRE" ? "Instituteur" : "Professeur de matière"}</Text>
      ) : null}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Modules à brancher</Text>
        {modules.map((item) => (
          <Text key={item} style={styles.item}>
            {item}
          </Text>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => logout()} style={styles.out}>
        <Text style={styles.outText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 64, gap: 10 },
  kicker: { color: colors.primary, fontWeight: "700", fontSize: 13, textTransform: "uppercase" },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, fontSize: 15 },
  panel: { backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 8, marginTop: 12 },
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
