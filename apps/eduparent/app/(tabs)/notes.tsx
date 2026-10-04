import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchNotes } from "@/lib/api";
import { matchesQuery, uniqueValues } from "@/lib/filter";
import { formatDate } from "@/lib/format";
import { colors, font, noteColor, radius, space, type } from "@/lib/theme";

function evalLabel(type: string) {
  if (type === "DEVOIR") return "Devoir";
  if (type === "COMPOSITION") return "Composition";
  if (type === "INTERROGATION") return "Interrogation";
  if (type === "TP") return "Travaux pratiques";
  return type;
}

function mentionOf(value: number | null) {
  if (value == null) return "Non calculée";
  if (value >= 16) return "Très bien";
  if (value >= 14) return "Bien";
  if (value >= 12) return "Assez bien";
  if (value >= 10) return "Passable";
  return "Insuffisant";
}

function rangLabel(rang: number) {
  return rang === 1 ? "1er de la classe" : `${rang}e de la classe`;
}

function scoreOn20(valeur: number, noteMax: number) {
  const max = noteMax || 20;
  return (valeur / max) * 20;
}

export default function NotesScreen() {
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchNotes>>["data"] | null>(null);
  const [periode, setPeriode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const periodes = useMemo(() => {
    const ordered: string[] = [];
    for (const m of payload?.moyennesGenerales ?? []) {
      if (!ordered.includes(m.periode)) ordered.push(m.periode);
    }
    for (const note of payload?.notes ?? []) {
      if (!ordered.includes(note.periode)) ordered.push(note.periode);
    }
    return ordered;
  }, [payload]);

  const notesFiltrees = useMemo(() => {
    if (!periode) return [];
    return (payload?.notes ?? []).filter((note) => {
      if (note.periode !== periode) return false;
      if (typeFilter && note.type !== typeFilter) return false;
      return matchesQuery(query, note.matiere, note.evaluation, evalLabel(note.type));
    });
  }, [payload, periode, query, typeFilter]);

  const types = useMemo(
    () => uniqueValues((payload?.notes ?? []).filter((note) => note.periode === periode).map((note) => note.type)),
    [payload, periode]
  );

  const generale = useMemo(
    () => payload?.moyennesGenerales.find((m) => m.periode === periode) ?? null,
    [payload, periode]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof notesFiltrees>();
    for (const note of notesFiltrees) {
      const list = map.get(note.matiere) ?? [];
      list.push(note);
      map.set(note.matiere, list);
    }
    return Array.from(map.entries());
  }, [notesFiltrees]);

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchNotes(selected.id);
    setPayload(res.data);
  }, [selected?.id]);

  useEffect(() => {
    setPeriode(null);
    setQuery("");
    setTypeFilter("");
  }, [selected?.id]);

  useEffect(() => {
    if (periode == null && periodes[0]) setPeriode(periodes[0]);
  }, [periodes, periode]);

  useEffect(() => {
    setTypeFilter("");
  }, [periode]);

  useFocusEffect(
    useCallback(() => {
      if (!selected) return;
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les notes")))
        .finally(() => setLoading(false));
    }, [load, selected])
  );

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Notes" switchChild />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour voir ses notes."
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        try {
          await load();
        } finally {
          setRefreshing(false);
        }
      }}
    >
      <PageTitle title="Notes" switchChild />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Matière, évaluation…"
        accessibilityLabel="Rechercher une note"
      />

      {periodes.length > 0 ? (
        <View style={styles.periodes}>
          {periodes.map((name) => (
            <Chip
              key={name}
              compact={periodes.length <= 3}
              label={name.replace("Trimestre", "Trim.")}
              selected={periode === name}
              onPress={() => setPeriode(name)}
            />
          ))}
        </View>
      ) : null}

      {types.length > 1 ? (
        <View style={styles.types}>
          <Chip label="Tous" selected={typeFilter === ""} onPress={() => setTypeFilter("")} />
          {types.map((item) => (
            <Chip
              key={item}
              label={evalLabel(item)}
              selected={typeFilter === item}
              onPress={() => setTypeFilter(typeFilter === item ? "" : item)}
            />
          ))}
        </View>
      ) : null}

      {loading && !payload ? <Skeleton count={3} /> : null}
      {error ? (
        <LoadError
          message={error}
          onRetry={() => {
            setLoading(true);
            load()
              .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les notes")))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {generale ? (
        <Enter>
        <Card style={styles.hero}>
          <Text style={[styles.heroKicker, font.medium]}>{periode}</Text>
          <View style={styles.heroRow}>
            <View>
              <Text
                style={[styles.heroValue, font.bold, { color: noteColor(generale.moyenne) }]}
                accessibilityLabel={`Moyenne ${generale.moyenne != null ? Number(generale.moyenne).toFixed(2) : "non calculée"} sur 20, ${generale.mention || mentionOf(generale.moyenne)}`}
              >
                {generale.moyenne != null ? Number(generale.moyenne).toFixed(2) : "—"}
              </Text>
              <Text style={[styles.heroOut, font.medium]}>/ 20</Text>
            </View>
            <View style={styles.heroSide}>
              <View style={styles.mention}>
                <Text style={[styles.mentionText, font.bold]}>
                  {generale.mention || mentionOf(generale.moyenne)}
                </Text>
              </View>
              {generale.rang != null ? (
                <Text style={[styles.rang, font.semibold]}>{rangLabel(generale.rang)}</Text>
              ) : null}
            </View>
          </View>
          <Text style={[styles.explain, font.regular]}>
            Moyenne générale : chaque matière est pondérée par son coefficient. Les notes absentes ne comptent pas.
          </Text>
        </Card>
        </Enter>
      ) : null}

      {grouped.map(([matiere, notes], index) => {
        const moyenne = payload?.moyennesMatieres.find((m) => m.matiere === matiere && m.periode === periode);
        const avg = moyenne?.moyenne != null ? Number(moyenne.moyenne) : null;
        return (
          <Enter key={matiere} index={index + 1}>
          <Card style={styles.group}>
            <View style={styles.groupHead}>
              <View style={{ flex: 1, paddingEnd: 8 }}>
                <Text style={[styles.matiere, font.bold]}>{matiere}</Text>
                <Text style={[styles.meta, font.regular]}>
                  {notes.length} note{notes.length > 1 ? "s" : ""} · moyenne simple sur 20
                </Text>
              </View>
              <Text
                style={[styles.groupAvg, font.bold, { color: noteColor(avg) }]}
                accessibilityLabel={`Moyenne ${matiere} ${avg != null ? avg.toFixed(2) : "non calculée"}, ${mentionOf(avg)}`}
              >
                {avg != null ? avg.toFixed(2) : "—"}
              </Text>
            </View>
            {notes.map((note) => {
              const value = note.valeur == null ? null : Number(note.valeur);
              const max = Number(note.noteMax) || 20;
              const sur20 = value == null ? null : scoreOn20(value, max);
              return (
                <View key={note.id} style={styles.row}>
                  <View style={[styles.mark, { backgroundColor: noteColor(sur20) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eval, font.semibold]}>{note.evaluation}</Text>
                    <Text style={[styles.meta, font.regular]}>
                      {evalLabel(note.type)}
                      {note.date ? ` · ${formatDate(note.date)}` : ""}
                    </Text>
                  </View>
                  <View style={styles.score}>
                    <Text
                      style={[styles.note, font.bold, { color: noteColor(sur20) }]}
                      accessibilityLabel={
                        value == null ? "Absent" : `${sur20?.toFixed(1)} sur 20, ${mentionOf(sur20)}`
                      }
                    >
                      {value == null ? "Abs" : sur20?.toFixed(max === 20 && Number.isInteger(value) ? 0 : 1)}
                    </Text>
                    {value != null && max !== 20 ? (
                      <Text style={[styles.meta, font.medium]}>{value}/{max}</Text>
                    ) : (
                      <Text style={[styles.meta, font.medium]}>/ 20</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
          </Enter>
        );
      })}

      {!loading && !error && payload && notesFiltrees.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title={query.trim() || typeFilter ? "Aucun résultat" : periode ? `Aucune note · ${periode}` : "Aucune note publiée"}
          body={
            query.trim() || typeFilter
              ? "Essayez un autre mot, ou touchez Tous pour revoir le trimestre."
              : `Les notes de ${selected.prenom} apparaîtront ici dès que les professeurs les publieront.`
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  periodes: { flexDirection: "row", gap: 8 },
  types: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  hero: { gap: 8 },
  heroKicker: { fontSize: type.meta, color: colors.muted },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  heroValue: { fontSize: 40, fontVariant: ["tabular-nums"], letterSpacing: -1, lineHeight: 44 },
  heroOut: { fontSize: 14, color: colors.muted, marginTop: 2 },
  heroSide: { alignItems: "flex-end", gap: 8, paddingBottom: 4 },
  mention: {
    backgroundColor: colors.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mentionText: { color: colors.primary, fontSize: 13 },
  rang: { fontSize: 13, color: colors.text },
  explain: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 4 },
  group: { gap: 12 },
  groupHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupAvg: { fontSize: 22, fontVariant: ["tabular-nums"] },
  row: { flexDirection: "row", alignItems: "center", gap: space.group },
  mark: { width: 4, height: 40, borderRadius: 2 },
  matiere: { fontSize: type.body, color: colors.text },
  eval: { fontSize: 15, color: colors.text },
  meta: { fontSize: type.meta, color: colors.muted, marginTop: 2 },
  score: { alignItems: "flex-end" },
  note: { fontSize: 20, fontVariant: ["tabular-nums"] },
});
