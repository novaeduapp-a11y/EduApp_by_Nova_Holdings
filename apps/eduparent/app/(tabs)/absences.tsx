import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { fetchAbsences } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { formatDate } from "@/lib/format";
import { colors, font, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

type AbsenceRow = Awaited<ReturnType<typeof fetchAbsences>>["data"]["absences"][number];
type Filter = "all" | "justifiee" | "nonJustifiee" | "retard";

function momentLabel(periode: string) {
  if (periode === "MATIN") return "Matin";
  if (periode === "APRES_MIDI") return "Après-midi";
  if (periode === "JOURNEE") return "Journée";
  return periode;
}

function trimestreRank(name: string) {
  if (/^1/.test(name)) return 1;
  if (/^2/.test(name)) return 2;
  if (/^3/.test(name)) return 3;
  return 9;
}

function monthKey(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Autre";
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function statsOf(rows: AbsenceRow[]) {
  const absences = rows.filter((row) => row.kind !== "RETARD");
  return {
    total: absences.length,
    justifiees: absences.filter((row) => row.justifiee).length,
    nonJustifiees: absences.filter((row) => !row.justifiee).length,
    retards: rows.filter((row) => row.kind === "RETARD").length,
  };
}

export default function AbsencesScreen() {
  const { selected } = useSession();
  const reduceMotion = useReduceMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchAbsences>>["data"] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [periode, setPeriode] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchAbsences(selected.id);
    setPayload(res.data);
  }, [selected?.id]);

  const periodes = useMemo(() => {
    const names = new Set<string>();
    for (const row of payload?.absences ?? []) names.add(row.trimestre);
    return Array.from(names).sort((a, b) => trimestreRank(a) - trimestreRank(b));
  }, [payload]);

  const duTrimestre = useMemo(() => {
    if (!periode) return [];
    return (payload?.absences ?? []).filter((row) => row.trimestre === periode);
  }, [payload, periode]);

  const stats = useMemo(() => statsOf(duTrimestre), [duTrimestre]);

  const filtered = useMemo(() => {
    let rows = duTrimestre;
    if (filter === "retard") rows = rows.filter((row) => row.kind === "RETARD");
    else if (filter === "justifiee") rows = rows.filter((row) => row.kind !== "RETARD" && row.justifiee);
    else if (filter === "nonJustifiee") rows = rows.filter((row) => row.kind !== "RETARD" && !row.justifiee);
    return rows.filter((row) =>
      matchesQuery(query, row.matiere, row.motif, formatDate(row.date), momentLabel(row.periode), row.trimestre)
    );
  }, [duTrimestre, filter, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, AbsenceRow[]>();
    for (const row of filtered) {
      const key = monthKey(row.date);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    setPeriode(null);
    setFilter("all");
    setQuery("");
  }, [selected?.id]);

  useEffect(() => {
    if (periode == null && payload?.absences[0]) setPeriode(payload.absences[0].trimestre);
  }, [payload, periode]);

  useFocusEffect(
    useCallback(() => {
      if (!selected) return;
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les absences")))
        .finally(() => setLoading(false));
    }, [load, selected])
  );

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Absences" switchChild />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour voir ses absences."
        />
      </Screen>
    );
  }

  const toggleFilter = (next: Filter) => setFilter((current) => (current === next ? "all" : next));

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        if (!selected) return;
        setRefreshing(true);
        try {
          await load();
        } catch (err) {
          setError(loadErrorMessage(err, "Impossible de charger les absences"));
        } finally {
          setRefreshing(false);
        }
      }}
    >
      <PageTitle title="Absences" switchChild />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Matière, motif, date…"
        accessibilityLabel="Rechercher une absence"
      />

      {periodes.length > 0 ? (
        <View style={styles.periodes}>
          {periodes.map((name) => (
            <Chip
              key={name}
              compact={periodes.length <= 3}
              label={name.replace("Trimestre", "Trim.")}
              selected={periode === name}
              onPress={() => {
                setPeriode(name);
                setFilter("all");
              }}
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
              .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les absences")))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {payload && periode ? (
        <Enter>
        <Card style={styles.hero}>
          <Text style={[styles.heroKicker, font.medium]}>{periode}</Text>
          <View style={styles.heroRow}>
            <View>
              <Text
                style={[styles.heroValue, font.bold, stats.nonJustifiees > 0 && { color: colors.fail }]}
                accessibilityLabel={`${stats.total} absence${stats.total > 1 ? "s" : ""}`}
              >
                {stats.total}
              </Text>
              <Text style={[styles.heroOut, font.medium]}>
                absence{stats.total > 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.heroSide}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: filter === "justifiee" }}
                onPress={() => toggleFilter("justifiee")}
                style={({ pressed }) => [
                  styles.mini,
                  filter === "justifiee" && styles.miniOn,
                  pressStyle(pressed, reduceMotion),
                ]}
              >
                <Text style={[styles.miniValue, font.bold]}>{stats.justifiees}</Text>
                <Text style={[styles.miniLabel, font.medium]}>Justifiées</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: filter === "nonJustifiee" }}
                onPress={() => toggleFilter("nonJustifiee")}
                style={({ pressed }) => [
                  styles.mini,
                  filter === "nonJustifiee" && styles.miniOn,
                  pressStyle(pressed, reduceMotion),
                ]}
              >
                <Text style={[styles.miniValue, font.bold, stats.nonJustifiees > 0 && { color: colors.fail }]}>
                  {stats.nonJustifiees}
                </Text>
                <Text style={[styles.miniLabel, font.medium]}>Non justifiées</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: filter === "retard" }}
                onPress={() => toggleFilter("retard")}
                style={({ pressed }) => [
                  styles.mini,
                  filter === "retard" && styles.miniOn,
                  pressStyle(pressed, reduceMotion),
                ]}
              >
                <Text style={[styles.miniValue, font.bold]}>{stats.retards}</Text>
                <Text style={[styles.miniLabel, font.medium]}>Retards</Text>
              </Pressable>
            </View>
          </View>
          <Text style={[styles.explain, font.regular]}>
            Les retards sont comptés à part. Une absence justifiée (mot, certificat) n’est pas sanctionnée.
          </Text>
        </Card>
        </Enter>
      ) : null}

      {grouped.map(([month, rows], monthIndex) => (
        <View key={month} style={styles.monthBlock}>
          <Text style={[styles.month, font.semibold]}>{month}</Text>
          {rows.map((absence, rowIndex) => {
            const isRetard = absence.kind === "RETARD";
            const chip = isRetard ? "Retard" : absence.justifiee ? "Justifiée" : "Non justifiée";
            return (
              <Enter key={absence.id} index={monthIndex + rowIndex + 1}>
              <Card style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={[styles.date, font.bold]}>{formatDate(absence.date)}</Text>
                  <View
                    style={[
                      styles.chip,
                      isRetard ? styles.chipNeutral : absence.justifiee ? styles.chipOk : styles.chipFail,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        font.bold,
                        isRetard ? styles.chipTextNeutral : absence.justifiee ? styles.chipTextOk : styles.chipTextFail,
                      ]}
                    >
                      {chip}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.meta, font.regular]}>
                  {isRetard ? "Retard" : absence.matiere ?? "Absence"} · {momentLabel(absence.periode)}
                  {absence.heures != null ? ` · ${Number(absence.heures)} h` : ""}
                </Text>
                {absence.motif ? <Text style={[styles.meta, font.regular]}>{absence.motif}</Text> : null}
              </Card>
              </Enter>
            );
          })}
        </View>
      ))}

      {!loading && !error && payload && filtered.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title={
            filter === "retard"
              ? "Aucun retard"
              : filter === "nonJustifiee"
                ? "Aucune absence non justifiée"
                : filter === "justifiee"
                  ? "Aucune absence justifiée"
                  : query.trim()
                    ? "Aucun résultat"
                    : periode
                      ? `Aucune absence · ${periode}`
                      : "Aucune absence"
          }
          body={
            filter === "all"
              ? `${selected.prenom} n’a ni absence ni retard enregistré pour cette période.`
              : "Touchez à nouveau le compteur pour revoir toute la période."
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  periodes: { flexDirection: "row", gap: 8 },
  hero: { gap: 8 },
  heroKicker: { fontSize: type.meta, color: colors.muted },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12 },
  heroValue: { fontSize: 40, color: colors.text, fontVariant: ["tabular-nums"], letterSpacing: -1, lineHeight: 44 },
  heroOut: { fontSize: 14, color: colors.muted, marginTop: 2 },
  heroSide: { flex: 1, gap: 6 },
  mini: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  miniOn: { backgroundColor: colors.tint },
  miniValue: { fontSize: 16, color: colors.text, fontVariant: ["tabular-nums"] },
  miniLabel: { fontSize: 12, color: colors.muted },
  explain: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 4 },
  monthBlock: { gap: 10 },
  month: { fontSize: 13, color: colors.muted, textTransform: "capitalize", marginTop: 4 },
  row: { gap: 6 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  date: { fontSize: type.body, color: colors.text },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipOk: { backgroundColor: colors.tint },
  chipFail: { backgroundColor: colors.failSoft },
  chipNeutral: { backgroundColor: colors.background },
  chipText: { fontSize: 11 },
  chipTextOk: { color: colors.primary },
  chipTextFail: { color: colors.fail },
  chipTextNeutral: { color: colors.muted },
  meta: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
