import { useCallback, useMemo, useState } from "react";
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
import { fetchEmploiDuTemps } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { weekdayKey } from "@/lib/format";
import { colors, font, type } from "@/lib/theme";

type Semaine = Awaited<ReturnType<typeof fetchEmploiDuTemps>>["data"]["semaine"];

export default function EdtScreen() {
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semaine, setSemaine] = useState<Semaine>([]);
  const [jour, setJour] = useState<Semaine[number]["jour"]>(weekdayKey() ?? "LUNDI");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchEmploiDuTemps(selected.id);
    setSemaine(res.data.semaine);
    const today = weekdayKey();
    if (today && res.data.semaine.some((d) => d.jour === today)) setJour(today);
  }, [selected?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!selected) return;
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err)))
        .finally(() => setLoading(false));
    }, [load, selected])
  );

  const selectedDay = semaine.find((d) => d.jour === jour);
  const cours = useMemo(() => {
    const rows = selectedDay?.cours ?? [];
    return rows.filter((item) => matchesQuery(query, item.matiere, item.professeur, item.salle, item.horaire));
  }, [selectedDay, query]);
  const totalCours = selectedDay?.cours.length ?? 0;

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Emploi du temps" switchChild showBack />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour voir l’emploi du temps."
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
        } catch (err) {
          setError(loadErrorMessage(err));
        } finally {
          setRefreshing(false);
        }
      }}
    >
      <PageTitle title="Emploi du temps" switchChild showBack />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Matière, professeur, salle…"
        accessibilityLabel="Rechercher un cours"
      />

      {semaine.length > 0 ? (
        <View style={styles.days}>
          {semaine.map((day) => (
            <Chip
              key={day.jour}
              compact
              label={day.label.slice(0, 3)}
              selected={day.jour === jour}
              onPress={() => setJour(day.jour)}
            />
          ))}
        </View>
      ) : null}

      {loading && semaine.length === 0 ? <Skeleton count={3} /> : null}
      {error ? (
        <LoadError
          message={error}
          onRetry={() => {
            setLoading(true);
            load()
              .catch((err) => setError(loadErrorMessage(err)))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {!loading && selectedDay ? (
        <Enter>
          <Card style={styles.hero}>
            <Text style={[styles.heroKicker, font.medium]}>{selectedDay.label}</Text>
            <Text style={[styles.heroValue, font.bold]}>
              {query.trim() ? `${cours.length} / ${totalCours}` : `${totalCours} cours`}
            </Text>
            <Text style={[styles.explain, font.regular]}>
              Semaine saisie par le préfet · {selected.classe}
            </Text>
          </Card>
        </Enter>
      ) : null}

      {cours.map((item, index) => (
        <Enter key={`${item.matiere}-${item.horaire}`} index={index + 1}>
          <Card style={styles.slot}>
            <View style={styles.slotRow}>
              <View style={styles.timeline}>
                <View style={styles.dot} />
                {index < cours.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.horaire, font.semibold]}>{item.horaire}</Text>
                <Text style={[styles.matiere, font.bold]}>{item.matiere}</Text>
                <Text style={[styles.muted, font.regular]}>
                  {[item.professeur, item.salle].filter(Boolean).join(" · ") || " "}
                </Text>
              </View>
            </View>
          </Card>
        </Enter>
      ))}

      {!loading && !error && cours.length === 0 && semaine.length > 0 ? (
        <EmptyState
          icon="time-outline"
          title={query.trim() ? "Aucun cours trouvé" : "Aucun cours ce jour"}
          body={
            query.trim()
              ? "Essayez le nom de la matière ou du professeur."
              : "L’emploi du temps apparaîtra ici dès que le préfet aura saisi les créneaux."
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { flexDirection: "row", gap: 8 },
  hero: { gap: 4 },
  heroKicker: { fontSize: type.meta, color: colors.muted },
  heroValue: { fontSize: 28, color: colors.text, letterSpacing: -0.4 },
  explain: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  slot: { paddingVertical: 14 },
  slotRow: { flexDirection: "row", gap: 12 },
  timeline: { width: 12, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  line: { width: 2, flex: 1, backgroundColor: colors.tint, marginTop: 4 },
  horaire: { fontSize: type.meta, color: colors.primary, fontVariant: ["tabular-nums"] },
  matiere: { fontSize: type.body, color: colors.text, marginTop: 2 },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});
