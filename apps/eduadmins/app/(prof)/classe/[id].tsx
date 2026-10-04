import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { fetchProfClasses, fetchProfEleves, type ProfClasse } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function ProfClasseDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [classe, setClasse] = useState<ProfClasse | null>(null);
  const [eleves, setEleves] = useState<Array<{ id: string; nom: string; prenom: string; matricule: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const [classesRes, elevesRes] = await Promise.all([fetchProfClasses(), fetchProfEleves(id)]);
    const found = classesRes.data.find((item) => item.id === id) ?? null;
    setClasse(found);
    setEleves(elevesRes.data);
    if (!found) throw new Error("Cette classe n’est pas dans votre périmètre");
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      load()
        .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger la classe"))
        .finally(() => setLoading(false));
    }, [id])
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
              setError(err instanceof Error ? err.message : "Impossible de charger la classe");
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Retour</Text>
      </Pressable>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {classe ? (
        <>
          <Text style={styles.title}>
            {classe.nom} · {classe.niveau}
          </Text>
          <Text style={styles.lead}>
            {classe.effectif} élève{classe.effectif > 1 ? "s" : ""}
            {classe.matieres.length ? ` · ${classe.matieres.map((m) => m.nom).join(", ")}` : ""}
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/notes", params: { classeId: classe.id } })}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.actionText}>Notes</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/appel", params: { classeId: classe.id } })}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.actionText}>Appel</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>Élèves</Text>
          {eleves.length === 0 ? <Text style={styles.muted}>Aucun élève dans cette classe.</Text> : null}
          {eleves.map((eleve) => (
            <View key={eleve.id} style={styles.row}>
              <Text style={styles.rowTitle}>
                {eleve.prenom} {eleve.nom}
              </Text>
              <Text style={styles.muted}>{eleve.matricule}</Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40, gap: 8 },
  back: { alignSelf: "flex-start", marginBottom: 4 },
  backText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  lead: { color: colors.muted, fontSize: 15, marginBottom: 8 },
  error: { color: colors.fail },
  actions: { flexDirection: "row", gap: 10, marginVertical: 8 },
  action: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  section: { marginTop: 12, fontSize: 17, fontWeight: "700", color: colors.text },
  row: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  rowTitle: { fontWeight: "600", color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14 },
});
