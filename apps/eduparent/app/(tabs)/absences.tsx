import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/context/session";
import { fetchAbsences } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function AbsencesScreen() {
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchAbsences>>["data"] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    fetchAbsences(selected.id)
      .then((res) => setPayload(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les absences"))
      .finally(() => setLoading(false));
  }, [selected?.id]);

  if (!selected) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>Sélectionnez un enfant sur l&apos;accueil.</Text>
      </View>
    );
  }

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
              const res = await fetchAbsences(selected.id);
              setPayload(res.data);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Impossible de charger les absences");
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Absences · {selected.prenom}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {payload ? (
        <Text style={styles.muted}>
          {payload.stats.total} au total · {payload.stats.justifiees} justifiée(s) · {payload.stats.nonJustifiees} non justifiée(s)
        </Text>
      ) : null}
      {(payload?.absences ?? []).map((absence) => (
        <View key={absence.id} style={styles.row}>
          <Text style={styles.date}>{new Date(absence.date).toLocaleDateString("fr-FR")}</Text>
          <Text style={styles.meta}>
            {absence.matiere ?? "Journée"} · {absence.periode}
            {absence.justifiee ? " · Justifiée" : " · Non justifiée"}
          </Text>
          {absence.motif ? <Text style={styles.meta}>{absence.motif}</Text> : null}
        </View>
      ))}
      {!loading && payload && payload.absences.length === 0 ? (
        <Text style={styles.muted}>Aucune absence enregistrée.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, gap: 10 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  row: { backgroundColor: colors.white, borderRadius: 14, padding: 14, gap: 4 },
  date: { fontSize: 16, fontWeight: "600", color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  error: { color: colors.fail },
  empty: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 },
  muted: { color: colors.muted, fontSize: 15 },
});
