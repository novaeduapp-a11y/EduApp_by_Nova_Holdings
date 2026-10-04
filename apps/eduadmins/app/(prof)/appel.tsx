import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { FilterChips } from "@/components/FilterChips";
import { SearchBar } from "@/components/SearchBar";
import {
  fetchAppel,
  fetchProfClasses,
  saveAppel,
  type AppelStatut,
  type ProfClasse,
} from "@/lib/api";
import { matchesQuery, uniqueValues } from "@/lib/filter";
import { todayIso } from "@/lib/format";
import { colors } from "@/lib/theme";

const STATUTS: { id: AppelStatut; label: string }[] = [
  { id: "PRESENT", label: "Présent" },
  { id: "ABSENT", label: "Absent" },
  { id: "RETARD", label: "Retard" },
];

export default function AppelScreen() {
  const date = useMemo(() => todayIso(), []);
  const params = useLocalSearchParams<{ classeId?: string }>();
  const [classes, setClasses] = useState<ProfClasse[]>([]);
  const [classeId, setClasseId] = useState<string | null>(params.classeId ?? null);
  const [lignes, setLignes] = useState<
    Array<{ eleveId: string; nom: string; prenom: string; matricule: string; statut: AppelStatut }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [niveau, setNiveau] = useState("");

  const loadClasses = async () => {
    const res = await fetchProfClasses();
    setClasses(res.data);
    setClasseId((current) => {
      if (params.classeId && res.data.some((c) => c.id === params.classeId)) return params.classeId;
      return current ?? res.data[0]?.id ?? null;
    });
    return res.data;
  };

  const loadAppel = async (id: string) => {
    const res = await fetchAppel(id, date);
    setLignes(res.data.eleves);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setMessage(null);
      loadClasses()
        .then((list) => {
          const first = classeId ?? list[0]?.id;
          if (first) return loadAppel(first);
        })
        .catch((err) => setMessage(err instanceof Error ? err.message : "Impossible de charger l’appel"))
        .finally(() => setLoading(false));
    }, [])
  );

  const selectClasse = async (id: string) => {
    setClasseId(id);
    setLoading(true);
    try {
      await loadAppel(id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Impossible de charger l’appel");
    } finally {
      setLoading(false);
    }
  };

  const niveaux = useMemo(() => uniqueValues(classes.map((classe) => classe.niveau)), [classes]);
  const classesVisibles = useMemo(
    () => (niveau ? classes.filter((classe) => classe.niveau === niveau) : classes),
    [classes, niveau]
  );
  const lignesVisibles = useMemo(
    () => lignes.filter((ligne) => matchesQuery(query, ligne.prenom, ligne.nom, ligne.matricule, `${ligne.prenom} ${ligne.nom}`)),
    [lignes, query]
  );

  const selectNiveau = (next: string) => {
    setNiveau(next);
    const pool = next ? classes.filter((classe) => classe.niveau === next) : classes;
    if (classeId && pool.some((classe) => classe.id === classeId)) return;
    const first = pool[0]?.id;
    if (first) void selectClasse(first);
  };

  const onSave = async () => {
    if (!classeId) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveAppel(
        classeId,
        date,
        lignes.map((ligne) => ({ eleveId: ligne.eleveId, statut: ligne.statut }))
      );
      setMessage("Feuille d’appel enregistrée.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            if (!classeId) return;
            setRefreshing(true);
            try {
              await loadAppel(classeId);
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Feuille d’appel</Text>
      <Text style={styles.lead}>Aujourd’hui · présent, absent ou retard.</Text>
      <SearchBar value={query} onChangeText={setQuery} />
      <FilterChips options={niveaux} value={niveau} onChange={selectNiveau} allLabel="Tous les niveaux" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {classesVisibles.map((classe) => {
          const active = classe.id === classeId;
          return (
            <Pressable
              key={classe.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => selectClasse(classe.id)}
              style={[styles.classChip, active && styles.classChipActive]}
            >
              <Text style={[styles.classChipText, active && styles.classChipTextActive]}>{classe.nom}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
      {!loading && lignes.length > 0 && lignesVisibles.length === 0 ? (
        <Text style={styles.muted}>Aucun élève ne correspond à cette recherche.</Text>
      ) : null}
      {lignesVisibles.map((ligne) => (
        <View key={ligne.eleveId} style={styles.card}>
          <Text style={styles.name}>
            {ligne.prenom} {ligne.nom}
          </Text>
          <View style={styles.row}>
            {STATUTS.map((statut) => {
              const active = ligne.statut === statut.id;
              return (
                <Pressable
                  key={statut.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() =>
                    setLignes((prev) =>
                      prev.map((item) => (item.eleveId === ligne.eleveId ? { ...item, statut: statut.id } : item))
                    )
                  }
                  style={[
                    styles.statut,
                    active && statut.id === "PRESENT" && styles.present,
                    active && statut.id === "ABSENT" && styles.absent,
                    active && statut.id === "RETARD" && styles.retard,
                  ]}
                >
                  <Text
                    style={[
                      styles.statutText,
                      active && (statut.id === "PRESENT" || statut.id === "ABSENT" || statut.id === "RETARD")
                        ? styles.statutTextActive
                        : null,
                    ]}
                  >
                    {statut.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {!loading && classes.length === 0 ? <Text style={styles.muted}>Aucune classe affectée.</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={onSave}
        disabled={saving || !classeId || lignes.length === 0}
        style={({ pressed }) => [
          styles.save,
          pressed && { opacity: 0.9 },
          (saving || !classeId || lignes.length === 0) && { opacity: 0.6 },
        ]}
      >
        <Text style={styles.saveText}>{saving ? "Enregistrement..." : "Enregistrer l’appel"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40, gap: 10 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  lead: { color: colors.muted, fontSize: 15 },
  chips: { gap: 8, paddingVertical: 4 },
  classChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: "center",
  },
  classChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  classChipText: { color: colors.text, fontWeight: "600" },
  classChipTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  name: { fontWeight: "700", color: colors.text, fontSize: 16 },
  row: { flexDirection: "row", gap: 8 },
  statut: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  present: { backgroundColor: colors.primary, borderColor: colors.primary },
  absent: { backgroundColor: colors.fail, borderColor: colors.fail },
  retard: { backgroundColor: colors.warn, borderColor: colors.warn },
  statutText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  statutTextActive: { color: colors.white },
  muted: { color: colors.muted },
  message: { color: colors.primary, fontWeight: "600" },
  save: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
