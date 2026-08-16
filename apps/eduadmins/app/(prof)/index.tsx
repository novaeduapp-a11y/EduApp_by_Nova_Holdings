import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSession } from "@/context/session";
import { fetchProfAccueil, type ProfAccueil } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { colors, greeting } from "@/lib/theme";

export default function ProfHome() {
  const router = useRouter();
  const { user } = useSession();
  const [data, setData] = useState<ProfAccueil | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchProfAccueil();
    setData(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      load()
        .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger l’accueil"))
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
              setError(err instanceof Error ? err.message : "Impossible de charger l’accueil");
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.hello}>
        {greeting()}
        {user?.prenom ? `, ${user.prenom}` : ""}
      </Text>
      <Text style={styles.lead}>
        {user?.typeProfesseur === "PRIMAIRE" ? "Instituteur" : "Professeur de matière"}
        {user?.ecole ? ` · ${user.ecole.nom}` : ""}
      </Text>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {data ? (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.totalClasses}</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.totalEleves}</Text>
              <Text style={styles.statLabel}>Élèves</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.evaluationsEnAttente}</Text>
              <Text style={styles.statLabel}>À saisir</Text>
            </View>
          </View>

          <Text style={styles.section}>Vos classes</Text>
          {data.classes.length === 0 ? (
            <Text style={styles.muted}>Aucune classe affectée pour le moment.</Text>
          ) : (
            data.classes.map((classe) => (
              <View key={classe.id} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {classe.nom} · {classe.niveau}
                </Text>
                <Text style={styles.muted}>
                  {classe.effectif} élève{classe.effectif > 1 ? "s" : ""} · {classe.matieres.join(", ")}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.section}>Évaluations récentes</Text>
          {data.evaluations.length === 0 ? (
            <Text style={styles.muted}>Aucune évaluation dans votre périmètre.</Text>
          ) : (
            data.evaluations.map((evaluation) => (
              <Pressable
                key={evaluation.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/evaluation/[id]", params: { id: evaluation.id } })}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.cardTitle}>
                  {evaluation.titre} · {evaluation.matiere}
                </Text>
                <Text style={styles.muted}>
                  {evaluation.classe} · {formatDate(evaluation.date)} · {evaluation.notesSaisies}/{evaluation.effectif} notes
                </Text>
              </Pressable>
            ))
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40, gap: 8 },
  hello: { fontSize: 26, fontWeight: "700", color: colors.text },
  lead: { color: colors.muted, fontSize: 15, marginBottom: 8 },
  error: { color: colors.fail, marginTop: 8 },
  stats: { flexDirection: "row", gap: 10, marginVertical: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: colors.primary },
  statLabel: { color: colors.muted, marginTop: 4, fontSize: 13 },
  section: { marginTop: 16, fontSize: 17, fontWeight: "700", color: colors.text },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardTitle: { fontWeight: "700", color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
