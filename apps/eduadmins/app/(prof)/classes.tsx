import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchProfClasses, fetchProfEleves, type ProfClasse } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function ClassesScreen() {
  const [classes, setClasses] = useState<ProfClasse[]>([]);
  const [eleves, setEleves] = useState<Record<string, Array<{ id: string; nom: string; prenom: string; matricule: string }>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetchProfClasses();
    setClasses(res.data);
    const next: typeof eleves = {};
    await Promise.all(
      res.data.map(async (classe) => {
        const pupils = await fetchProfEleves(classe.id);
        next[classe.id] = pupils.data;
      })
    );
    setEleves(next);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      load()
        .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les classes"))
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
              setError(err instanceof Error ? err.message : "Impossible de charger les classes");
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Classes autorisées</Text>
      <Text style={styles.lead}>Uniquement les classes et matières qui vous sont affectées.</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && classes.length === 0 ? <Text style={styles.muted}>Aucune classe dans votre périmètre.</Text> : null}
      {classes.map((classe) => (
        <View key={classe.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {classe.nom} · {classe.niveau}
          </Text>
          <Text style={styles.muted}>
            {classe.effectif} élève{classe.effectif > 1 ? "s" : ""} · {classe.matieres.map((m) => m.nom).join(", ")}
          </Text>
          {(eleves[classe.id] ?? []).map((eleve) => (
            <Text key={eleve.id} style={styles.eleve}>
              {eleve.prenom} {eleve.nom}
              <Text style={styles.muted}> · {eleve.matricule}</Text>
            </Text>
          ))}
        </View>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardTitle: { fontWeight: "700", color: colors.text, fontSize: 17 },
  muted: { color: colors.muted, fontSize: 14 },
  eleve: { color: colors.text, fontSize: 15, paddingTop: 4 },
});
