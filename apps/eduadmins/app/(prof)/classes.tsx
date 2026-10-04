import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { FilterChips } from "@/components/FilterChips";
import { SearchBar } from "@/components/SearchBar";
import { fetchProfClasses, fetchProfEleves, type ProfClasse } from "@/lib/api";
import { matchesQuery, uniqueValues } from "@/lib/filter";
import { colors } from "@/lib/theme";

export default function ClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ProfClasse[]>([]);
  const [eleves, setEleves] = useState<
    Record<string, Array<{ id: string; nom: string; prenom: string; matricule: string }>>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [niveau, setNiveau] = useState("");

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

  const niveaux = useMemo(() => uniqueValues(classes.map((classe) => classe.niveau)), [classes]);

  const visible = useMemo(() => {
    return classes
      .filter((classe) => !niveau || classe.niveau === niveau)
      .map((classe) => {
        const pupils = (eleves[classe.id] ?? []).filter((eleve) =>
          matchesQuery(query, eleve.prenom, eleve.nom, eleve.matricule, `${eleve.prenom} ${eleve.nom}`)
        );
        const classMatch = matchesQuery(query, classe.nom, classe.niveau, ...classe.matieres.map((m) => m.nom));
        return { classe, pupils, classMatch };
      })
      .filter((row) => {
        if (!query.trim()) return true;
        return row.classMatch || row.pupils.length > 0;
      });
  }, [classes, eleves, niveau, query]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
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
      <Text style={styles.lead}>
        Uniquement les classes et matières qui vous sont affectées. Touchez une classe pour l’ouvrir.
      </Text>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Nom, prénom, matricule…"
        accessibilityLabel="Rechercher un élève"
      />
      <FilterChips options={niveaux} value={niveau} onChange={setNiveau} allLabel="Tous les niveaux" />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && classes.length === 0 ? <Text style={styles.muted}>Aucune classe dans votre périmètre.</Text> : null}
      {!loading && classes.length > 0 && visible.length === 0 ? (
        <Text style={styles.muted}>Aucun élève ne correspond à cette recherche.</Text>
      ) : null}
      {visible.map(({ classe, pupils }) => (
        <Pressable
          key={classe.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/classe/[id]", params: { id: classe.id } })}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.cardTitle}>
            {classe.nom} · {classe.niveau}
          </Text>
          <Text style={styles.muted}>
            {classe.effectif} élève{classe.effectif > 1 ? "s" : ""} · {classe.matieres.map((m) => m.nom).join(", ")}
          </Text>
          {(query.trim() && pupils.length > 0 ? pupils : eleves[classe.id] ?? []).slice(0, 4).map((eleve) => (
            <Text key={eleve.id} style={styles.eleve}>
              {eleve.prenom} {eleve.nom}
              <Text style={styles.muted}> · {eleve.matricule}</Text>
            </Text>
          ))}
          {(eleves[classe.id] ?? []).length > 4 && !query.trim() ? (
            <Text style={styles.muted}>Voir toute la classe…</Text>
          ) : null}
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
