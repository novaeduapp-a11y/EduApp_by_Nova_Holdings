import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { fetchProfEvaluations, type ProfEvaluation } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function NotesScreen() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<ProfEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchProfEvaluations();
    setEvaluations(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      load()
        .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les notes"))
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Impossible de charger les notes");
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Saisie des notes</Text>
      <Text style={styles.lead}>Évaluations de vos classes et matières uniquement.</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && evaluations.length === 0 ? (
        <Text style={styles.muted}>Aucune évaluation à saisir dans votre périmètre.</Text>
      ) : null}
      {evaluations.map((evaluation) => (
        <Pressable
          key={evaluation.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/evaluation/[id]", params: { id: evaluation.id } })}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.cardTitle}>{evaluation.titre}</Text>
          <Text style={styles.muted}>
            {evaluation.classe.nom} · {evaluation.matiere.nom} · {evaluation.periode.nom}
          </Text>
          <Text style={styles.muted}>
            {formatDate(evaluation.date)} · {evaluation.notesSaisies} note{evaluation.notesSaisies > 1 ? "s" : ""} · /{evaluation.noteSur}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40, gap: 10 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  lead: { color: colors.muted, fontSize: 15, marginBottom: 8 },
  error: { color: colors.fail },
  muted: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardTitle: { fontWeight: "700", color: colors.text, fontSize: 16 },
});
