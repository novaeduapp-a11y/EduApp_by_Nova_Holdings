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
        <PageTitle title="Absences" switchChild showBack />
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
      <PageTitle title="Absences" switchChild showBack />

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
            <View style={styles.heroRow}>
              <Text style={[styles.heroValue, font.bold]}>{stats.total}</Text>
              <View style={styles.heroCopy}>
                <Text style={[styles.heroOut, font.semibold]}>
                  absence{stats.total > 1 ? "s" : ""}
                </Text>
                <Text style={[styles.heroKicker, font.regular]}>{periode}</Text>
              </View>
            </View>
            <View style={styles.tiles}>
              {(
                [
                  { key: "justifiee", value: stats.justifiees, label: "Justifiées", tone: "ok" },
                  {
                    key: "nonJustifiee",
                    value: stats.nonJustifiees,
                    label: "À justifier",
                    tone: stats.nonJustifiees > 0 ? "fail" : "neutral",
                  },
                  { key: "retard", value: stats.retards, label: "Retards", tone: "neutral" },
                ] as const
              ).map((tile) => {
                const on = filter === tile.key;
                const tone = TONES[tile.tone];
                return (
                  <Pressable
                    key={tile.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${tile.value} ${tile.label}. ${on ? "Filtre actif" : "Filtrer"}`}
                    accessibilityState={{ selected: on }}
                    onPress={() => toggleFilter(tile.key)}
                    style={({ pressed }) => [
                      styles.tile,
                      { backgroundColor: tone.soft },
                      on && { borderColor: tone.fg },
                      pressStyle(pressed, reduceMotion),
                    ]}
                  >
                    <Text style={[styles.tileValue, font.bold, { color: tone.fg }]}>{tile.value}</Text>
                    <Text style={[styles.tileLabel, font.medium]} numberOfLines={1}>
                      {tile.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.explain, font.regular]}>
              Touchez un compteur pour filtrer. Les retards sont comptés à part.
            </Text>
          </Card>
        </Enter>
      ) : null}

      {grouped.map(([month, rows], monthIndex) => (
        <Enter key={month} index={monthIndex + 1}>
          <View style={styles.monthBlock}>
            <Text style={[styles.month, font.semibold]}>
              {month} · {rows.length}
            </Text>
            <Card style={styles.monthCard}>
              {rows.map((absence, rowIndex) => {
                const isRetard = absence.kind === "RETARD";
                const tone = TONES[isRetard ? "neutral" : absence.justifiee ? "ok" : "fail"];
                const chip = isRetard ? "Retard" : absence.justifiee ? "Justifiée" : "À justifier";
                const d = new Date(absence.date);
                const valid = !Number.isNaN(d.getTime());
                return (
                  <View key={absence.id} style={[styles.row, rowIndex > 0 && styles.rowDivider]}>
                    <View style={[styles.dateBox, { backgroundColor: tone.soft }]}>
                      <Text style={[styles.dateDay, font.bold, { color: tone.fg }]}>
                        {valid ? d.getDate() : "—"}
                      </Text>
                      <Text style={[styles.dateDow, font.medium, { color: tone.fg }]}>
                        {valid ? d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "") : ""}
                      </Text>
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowTitle, font.semibold]} numberOfLines={1}>
                        {isRetard ? "Retard" : absence.matiere ?? "Absence"}
                      </Text>
                      <Text style={[styles.meta, font.regular]} numberOfLines={1}>
                        {absence.creneau
                          ? absence.creneau
                          : `${momentLabel(absence.periode)} (demi-journée)`}
                        {!absence.creneau && absence.heures != null
                          ? ` · ${Number(absence.heures)} h`
                          : ""}
                      </Text>
                      {absence.motif ? (
                        <Text style={[styles.meta, font.regular]} numberOfLines={2}>
                          {absence.motif}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.chip, { backgroundColor: tone.soft }]}>
                      <Text style={[styles.chipText, font.bold, { color: tone.fg }]}>{chip}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        </Enter>
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
  hero: { gap: 14 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroValue: { fontSize: 44, color: colors.text, fontVariant: ["tabular-nums"], letterSpacing: -1, lineHeight: 48 },
  heroCopy: { gap: 1 },
  heroOut: { fontSize: type.body, color: colors.text },
  heroKicker: { fontSize: type.meta, color: colors.muted },
  tiles: { flexDirection: "row", gap: 8 },
  tile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
    gap: 2,
  },
  tileValue: { fontSize: 22, fontVariant: ["tabular-nums"], lineHeight: 26 },
  tileLabel: { fontSize: 12, color: colors.text },
  explain: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  monthBlock: { gap: 8 },
  month: { fontSize: type.meta, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginStart: 4 },
  monthCard: { paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dateBox: { width: 46, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dateDay: { fontSize: 18, fontVariant: ["tabular-nums"], lineHeight: 22 },
  dateDow: { fontSize: 11, textTransform: "capitalize" },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, color: colors.text },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11 },
  meta: { fontSize: type.meta, color: colors.muted, lineHeight: 18 },
});

const TONES = {
  ok: { fg: colors.good, soft: colors.goodSoft },
  fail: { fg: colors.fail, soft: colors.failSoft },
  neutral: { fg: colors.muted, soft: colors.background },
} as const;
