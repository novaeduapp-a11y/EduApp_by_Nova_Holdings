import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/context/session";
import { fetchAccueil } from "@/lib/api";
import { colors, greeting, noteColor } from "@/lib/theme";

type Accueil = Awaited<ReturnType<typeof fetchAccueil>>["data"];

export default function AccueilScreen() {
  const { user, enfants, selected, selectChild } = useSession();
  const [accueil, setAccueil] = useState<Accueil | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hello = greeting();

  useEffect(() => {
    if (!selected) {
      setAccueil(null);
      return;
    }
    setLoading(true);
    fetchAccueil(selected.id)
      .then((res) => setAccueil(res.data))
      .catch(() => setAccueil(null))
      .finally(() => setLoading(false));
  }, [selected?.id]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            if (!selected) return;
            setRefreshing(true);
            try {
              const res = await fetchAccueil(selected.id);
              setAccueil(res.data);
            } catch {
              setAccueil(null);
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.hello}>
        {hello}
        {user?.prenom ? `, ${user.prenom}` : ""}
      </Text>
      <Text style={styles.lead}>
        {selected
          ? `Suivi de ${selected.prenom} · ${selected.classe}`
          : "Aucun enfant lié pour le moment"}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {enfants.map((enfant) => {
          const active = enfant.id === selected?.id;
          return (
            <Pressable
              key={enfant.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => selectChild(enfant.id)}
              style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.pressed]}
            >
              <View style={[styles.avatar, active && styles.avatarActive]}>
                <Text style={[styles.initial, active && styles.initialActive]}>
                  {enfant.prenom.slice(0, 1)}
                </Text>
              </View>
              <Text style={[styles.cardName, active && styles.cardNameActive]}>{enfant.prenom}</Text>
              <Text style={styles.cardMeta}>{enfant.classe}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {accueil ? (
        <View style={styles.kpis}>
          <View style={styles.kpi}>
            <Text style={[styles.kpiValue, { color: noteColor(accueil.moyenne?.valeur ?? null) }]}>
              {accueil.moyenne?.valeur != null ? Number(accueil.moyenne.valeur).toFixed(1) : "—"}
            </Text>
            <Text style={styles.kpiLabel}>Moyenne</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>{accueil.absences.total}</Text>
            <Text style={styles.kpiLabel}>Absences</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>{accueil.notificationsNonLues}</Text>
            <Text style={styles.kpiLabel}>Non lues</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Notes récentes</Text>
        {(accueil?.notesRecentes ?? []).map((note) => {
          const value = note.valeur == null ? null : Number(note.valeur);
          return (
            <View key={note.id} style={styles.noteRow}>
              <Text style={styles.row}>{note.matiere} · {note.evaluation}</Text>
              <Text style={[styles.noteVal, { color: noteColor(value) }]}>
                {value == null ? "—" : value}
              </Text>
            </View>
          );
        })}
        {accueil && accueil.notesRecentes.length === 0 ? (
          <Text style={styles.row}>Aucune note publiée pour le moment.</Text>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Emploi du temps du jour</Text>
        {accueil?.coursDuJour.length ? (
          accueil.coursDuJour.map((cours) => (
            <Text key={`${cours.matiere}-${cours.horaire}`} style={styles.row}>
              {cours.horaire} · {cours.matiere}
              {cours.salle ? ` · ${cours.salle}` : ""}
            </Text>
          ))
        ) : (
          <Text style={styles.row}>Pas encore saisi par l&apos;établissement.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, gap: 12 },
  hello: { fontSize: 26, fontWeight: "700", color: colors.text },
  lead: { fontSize: 16, color: colors.muted, marginBottom: 8 },
  cards: { gap: 12, paddingVertical: 8 },
  card: {
    width: 120,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: { borderColor: colors.primary, backgroundColor: "#E8F0FE" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarActive: { backgroundColor: colors.primary },
  initial: { fontSize: 18, fontWeight: "700", color: colors.primary },
  initialActive: { color: colors.white },
  cardName: { fontSize: 16, fontWeight: "600", color: colors.text },
  cardNameActive: { color: colors.primary },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  kpis: { flexDirection: "row", gap: 10 },
  kpi: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  kpiValue: { fontSize: 22, fontWeight: "700", color: colors.text },
  kpiLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
  panel: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  panelTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  row: { fontSize: 15, color: colors.muted, lineHeight: 22, flex: 1 },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  noteVal: { fontSize: 16, fontWeight: "700" },
  pressed: { transform: [{ scale: 0.96 }] },
});
