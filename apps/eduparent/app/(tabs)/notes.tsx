import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/context/session";
import { fetchNotes } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { colors, noteColor } from "@/lib/theme";

export default function NotesScreen() {
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchNotes>>["data"] | null>(null);
  const [periode, setPeriode] = useState<string | null>(null);

  const periodes = useMemo(() => {
    const names = new Set<string>();
    for (const m of payload?.moyennesGenerales ?? []) names.add(m.periode);
    for (const note of payload?.notes ?? []) names.add(note.periode);
    return Array.from(names);
  }, [payload]);

  const notesFiltrees = useMemo(() => {
    const notes = payload?.notes ?? [];
    if (!periode) return notes;
    return notes.filter((note) => note.periode === periode);
  }, [payload, periode]);

  const load = async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchNotes(selected.id);
    setPayload(res.data);
  };

  useEffect(() => {
    if (!selected) return;
    setPeriode(null);
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les notes"))
      .finally(() => setLoading(false));
  }, [selected?.id]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof notesFiltrees>();
    for (const note of notesFiltrees) {
      const list = map.get(note.matiere) ?? [];
      list.push(note);
      map.set(note.matiere, list);
    }
    return Array.from(map.entries());
  }, [notesFiltrees]);

  if (!selected) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sélectionnez un enfant sur l&apos;accueil.</Text>
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
            setRefreshing(true);
            try {
              await load();
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Notes · {selected.prenom}</Text>
      {periodes.length > 1 ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setPeriode(null)}
            style={[styles.chip, periode == null && styles.chipActive]}
          >
            <Text style={[styles.chipText, periode == null && styles.chipTextActive]}>Toutes</Text>
          </Pressable>
          {periodes.map((name) => {
            const active = periode === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                onPress={() => setPeriode(name)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {payload?.moyennesGenerales
        .filter((m) => !periode || m.periode === periode)
        .map((m) => (
        <View key={m.periode} style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>{m.periode}</Text>
            {m.mention ? <Text style={styles.meta}>{m.mention}</Text> : null}
          </View>
          <Text style={[styles.summaryValue, { color: noteColor(m.moyenne) }]}>
            {m.moyenne != null ? Number(m.moyenne).toFixed(2) : "—"} / 20
          </Text>
        </View>
      ))}

      {grouped.map(([matiere, notes]) => {
        const moyenne = payload?.moyennesMatieres.find(
          (m) => m.matiere === matiere && (!periode || m.periode === periode)
        );
        return (
          <View key={matiere} style={styles.group}>
            <View style={styles.groupHead}>
              <Text style={styles.matiere}>{matiere}</Text>
              {moyenne?.moyenne != null ? (
                <Text style={[styles.groupAvg, { color: noteColor(Number(moyenne.moyenne)) }]}>
                  {Number(moyenne.moyenne).toFixed(2)}
                </Text>
              ) : null}
            </View>
            {notes.map((note) => {
              const value = note.valeur == null ? null : Number(note.valeur);
              return (
                <View key={note.id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eval}>{note.evaluation}</Text>
                    <Text style={styles.meta}>
                      {note.type} · coef {Number(note.coefficient)}
                      {note.date ? ` · ${formatDate(note.date)}` : ""}
                    </Text>
                  </View>
                  <Text style={[styles.note, { color: noteColor(value) }]}>
                    {value == null ? "Abs" : `${value}/${Number(note.noteMax)}`}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}

      {!loading && notesFiltrees.length === 0 ? (
        <Text style={styles.emptyText}>Aucune note publiée pour le moment.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, gap: 10 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 8 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  chipTextActive: { color: colors.white },
  summary: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { color: colors.text, fontWeight: "700", fontSize: 16 },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  group: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  groupHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupAvg: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  matiere: { fontSize: 16, fontWeight: "700", color: colors.text },
  eval: { fontSize: 15, fontWeight: "600", color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  note: { fontSize: 18, fontWeight: "700" },
  error: { color: colors.fail },
  empty: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 },
  emptyText: { color: colors.muted, fontSize: 16 },
});
