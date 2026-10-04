import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SearchBar } from "@/components/SearchBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchProfEvaluation, saveProfNotes, type ProfEvaluationDetail } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { colors } from "@/lib/theme";

type Draft = Record<string, { note: string; absent: boolean }>;

export default function EvaluationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<ProfEvaluationDetail | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProfEvaluation(id)
      .then((res) => {
        setDetail(res.data);
        const next: Draft = {};
        for (const eleve of res.data.eleves) {
          next[eleve.eleveId] = {
            note: eleve.note == null ? "" : String(eleve.note),
            absent: eleve.absent,
          };
        }
        setDraft(next);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Impossible de charger"))
      .finally(() => setLoading(false));
  }, [id]);

  const elevesVisibles = useMemo(
    () =>
      (detail?.eleves ?? []).filter((eleve) =>
        matchesQuery(query, eleve.prenom, eleve.nom, eleve.matricule, `${eleve.prenom} ${eleve.nom}`)
      ),
    [detail, query]
  );

  const onSave = async () => {
    if (!id || !detail) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveProfNotes(
        id,
        detail.eleves.map((eleve) => {
          const row = draft[eleve.eleveId];
          const parsed = row?.note ? Number(row.note.replace(",", ".")) : null;
          return {
            eleveId: eleve.eleveId,
            note: row?.absent ? null : Number.isFinite(parsed) ? parsed : null,
            absent: Boolean(row?.absent),
          };
        })
      );
      setMessage("Notes enregistrées.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title={detail ? `${detail.titre} · ${detail.matiere.nom}` : "Saisie"} />
        {detail ? (
          <Text style={styles.lead}>
            {detail.classe.nom} · note sur {detail.noteSur}
          </Text>
        ) : null}
        <SearchBar value={query} onChangeText={setQuery} />
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {!loading && detail && elevesVisibles.length === 0 ? (
          <Text style={styles.muted}>Aucun élève ne correspond à cette recherche.</Text>
        ) : null}
        {elevesVisibles.map((eleve) => {
          const row = draft[eleve.eleveId];
          return (
            <View key={eleve.eleveId} style={styles.row}>
              <View style={styles.identity}>
                <Text style={styles.name}>
                  {eleve.prenom} {eleve.nom}
                </Text>
                <Text style={styles.muted}>{eleve.matricule}</Text>
              </View>
              <TextInput
                accessibilityLabel={`Note de ${eleve.prenom}`}
                keyboardType="decimal-pad"
                editable={!row?.absent}
                value={row?.absent ? "" : row?.note ?? ""}
                onChangeText={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    [eleve.eleveId]: { note: value, absent: false },
                  }))
                }
                placeholder={`/ ${detail?.noteSur ?? 20}`}
                style={[styles.input, row?.absent && styles.inputDisabled]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(row?.absent) }}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    [eleve.eleveId]: { note: "", absent: !prev[eleve.eleveId]?.absent },
                  }))
                }
                style={[styles.chip, row?.absent && styles.chipActive]}
              >
                <Text style={[styles.chipText, row?.absent && styles.chipTextActive]}>Abs</Text>
              </Pressable>
            </View>
          );
        })}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={onSave}
          disabled={saving || !detail}
          style={({ pressed }) => [styles.save, pressed && { opacity: 0.9 }, (saving || !detail) && { opacity: 0.6 }]}
        >
          <Text style={styles.saveText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40, gap: 10 },
  lead: { color: colors.muted, marginBottom: 8 },
  row: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  identity: { flex: 1 },
  name: { fontWeight: "700", color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  input: {
    width: 72,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputDisabled: { opacity: 0.4 },
  chip: {
    minHeight: 44,
    minWidth: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.fail, borderColor: colors.fail },
  chipText: { color: colors.muted, fontWeight: "700" },
  chipTextActive: { color: colors.white },
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
