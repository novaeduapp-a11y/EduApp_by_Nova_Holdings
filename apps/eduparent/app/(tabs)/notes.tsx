import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PortalHeader } from "@/components/PortalHeader";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchNotes } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { formatNoteFr, rangLabel } from "@/lib/format";
import { colors, font, noteColor, noteSoft, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

export default function NotesScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchNotes>>["data"] | null>(null);
  const [periode, setPeriode] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const generale = useMemo(
    () => payload?.moyennesGenerales.find((m) => m.periode === periode) ?? null,
    [payload, periode]
  );

  const subjects = useMemo(() => {
    if (!periode || !payload) return [];
    const map = new Map<
      string,
      {
        matiere: string;
        moyenne: number | null;
        coefficient?: number;
        professeur?: string | null;
        count: number;
      }
    >();
    for (const m of payload.moyennesMatieres.filter((item) => item.periode === periode)) {
      map.set(m.matiere, {
        matiere: m.matiere,
        moyenne: m.moyenne != null ? Number(m.moyenne) : null,
        coefficient: m.coefficient,
        professeur: m.professeur,
        count: 0,
      });
    }
    for (const note of payload.notes.filter((n) => n.periode === periode)) {
      const current = map.get(note.matiere) ?? {
        matiere: note.matiere,
        moyenne: null,
        count: 0,
      };
      current.count += 1;
      map.set(note.matiere, current);
    }
    return Array.from(map.values())
      .filter((item) => matchesQuery(query, item.matiere, item.professeur ?? ""))
      .sort((a, b) => a.matiere.localeCompare(b.matiere, "fr"));
  }, [payload, periode, query]);

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchNotes(selected.id);
    setPayload(res.data);
  }, [selected?.id]);

  useEffect(() => {
    setPeriode(null);
    setQuery("");
  }, [selected?.id]);

  useEffect(() => {
    if (periode == null && periodes[0]) setPeriode(periodes[0]);
  }, [periodes, periode]);

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
        <PortalHeader />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour voir ses notes."
        />
      </Screen>
    );
  }

  const avg = generale?.moyenne != null ? Number(generale.moyenne) : null;

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
      <PortalHeader />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une matière…"
        accessibilityLabel="Rechercher une matière"
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

      {generale || avg != null ? (
        <Enter>
          <Card style={styles.hero}>
            <Text style={[styles.heroKicker, font.medium]}>MOYENNE GÉNÉRALE</Text>
            <Text style={[styles.heroScore, font.bold, { color: colors.primary }]}>
              {avg != null ? `${formatNoteFr(avg, 2)} / 20` : "—"}
            </Text>
            <View style={styles.pills}>
              {generale?.rang != null ? (
                <View style={styles.pill}>
                  <Text style={[styles.pillText, font.semibold]}>Rang {rangLabel(generale.rang)}</Text>
                </View>
              ) : null}
              <View style={styles.pill}>
                <Text style={[styles.pillText, font.semibold]}>
                  {subjects.length} matière{subjects.length > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </Card>
        </Enter>
      ) : null}

      {subjects.length > 0 ? (
        <Text style={[styles.section, font.bold]}>Résultats par matière</Text>
      ) : null}

      {subjects.map((item, index) => {
        const ratio = item.moyenne == null ? 0 : Math.max(0, Math.min(1, item.moyenne / 20));
        return (
          <Enter key={item.matiere} index={index + 1}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.matiere}, moyenne ${item.moyenne != null ? formatNoteFr(item.moyenne) : "non calculée"}. Voir les devoirs`}
              onPress={() =>
                router.push({
                  pathname: "/matiere",
                  params: { matiere: item.matiere, periode: periode ?? "" },
                } as unknown as Href)
              }
              style={({ pressed }) => [styles.subject, pressStyle(pressed, reduceMotion)]}
            >
              <View style={[styles.scoreBox, { backgroundColor: noteSoft(item.moyenne) }]}>
                <Text style={[styles.scoreText, font.bold, { color: noteColor(item.moyenne) }]}>
                  {item.moyenne != null ? formatNoteFr(item.moyenne) : "—"}
                </Text>
              </View>
              <View style={styles.subjectCopy}>
                <Text style={[styles.matiere, font.bold]} numberOfLines={1}>
                  {item.matiere}
                </Text>
                <View style={[styles.track, { backgroundColor: noteSoft(item.moyenne) }]}>
                  <View
                    style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: noteColor(item.moyenne) }]}
                  />
                </View>
                <Text style={[styles.meta, font.regular]} numberOfLines={1}>
                  {[
                    item.coefficient != null ? `coeff. ${item.coefficient}` : null,
                    item.professeur,
                    `${item.count} note${item.count > 1 ? "s" : ""}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          </Enter>
        );
      })}

      {!loading && !error && payload && subjects.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title={query.trim() ? "Aucun résultat" : periode ? `Aucune note · ${periode}` : "Aucune note publiée"}
          body={
            query.trim()
              ? "Essayez un autre mot."
              : `Les notes de ${selected.prenom} apparaîtront ici dès que les professeurs les publieront.`
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  periodes: { flexDirection: "row", gap: 8 },
  hero: { gap: 10, backgroundColor: colors.tint, borderWidth: 0 },
  heroKicker: { fontSize: 12, color: colors.muted, letterSpacing: 0.8 },
  heroScore: { fontSize: 34, fontVariant: ["tabular-nums"], letterSpacing: -0.5 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 13, color: colors.primary },
  section: { fontSize: 16, color: colors.text },
  subject: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 14,
  },
  scoreBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: { fontSize: 16, fontVariant: ["tabular-nums"] },
  subjectCopy: { flex: 1, gap: 6 },
  matiere: { fontSize: type.body, color: colors.text },
  track: { height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: 5, borderRadius: 3 },
  meta: { fontSize: type.meta, color: colors.muted },
});
