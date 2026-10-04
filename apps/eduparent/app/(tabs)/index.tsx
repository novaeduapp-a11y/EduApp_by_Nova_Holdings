import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "@/components/Card";
import { ChildSwitcher } from "@/components/ChildSwitcher";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchAccueil } from "@/lib/api";
import {
  colors,
  font,
  greeting,
  noteColor,
  noteLabel,
  pressStyle,
  radius,
  shadow,
  space,
  type,
  useReduceMotion,
} from "@/lib/theme";

type Accueil = Awaited<ReturnType<typeof fetchAccueil>>["data"];
const MAX_NOTES = 3;

export default function AccueilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { user, enfants, selected } = useSession();
  const [accueil, setAccueil] = useState<Accueil | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hello = greeting();

  const load = useCallback(async () => {
    if (!selected) {
      setAccueil(null);
      setError(null);
      return;
    }
    setError(null);
    const res = await fetchAccueil(selected.id);
    setAccueil(res.data);
  }, [selected?.id]);

  const runLoad = useCallback(() => {
    setLoading(true);
    load()
      .catch((err) => setError(loadErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setAccueil(null);
      setError(null);
      return;
    }
    runLoad();
  }, [runLoad, selected]);

  useFocusEffect(
    useCallback(() => {
      runLoad();
    }, [runLoad])
  );

  const notesRecentes = accueil?.notesRecentes.slice(0, MAX_NOTES) ?? [];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.primaryDeep, colors.primary, "#3D7AE8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <Text style={[styles.kicker, font.medium]}>{hello}</Text>
        <Text style={[styles.hello, font.bold]}>{user?.prenom ?? "Parent"}</Text>
        {enfants.length > 0 ? <ChildSwitcher light /> : null}
      </LinearGradient>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
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
            tintColor={colors.primary}
          />
        }
      >
        {loading && !accueil ? <Skeleton count={2} /> : null}
        {error ? <LoadError message={error} onRetry={runLoad} /> : null}

        {accueil ? (
          <Enter>
            <View style={styles.kpis}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Moyenne ${accueil.moyenne?.valeur != null ? Number(accueil.moyenne.valeur).toFixed(1) : "non calculée"}. Voir les notes`}
                onPress={() => router.push("/notes")}
                style={({ pressed }) => [styles.kpi, styles.kpiMain, shadow.card, pressStyle(pressed, reduceMotion)]}
              >
                <Text style={[styles.kpiEyebrow, font.medium]}>Moyenne</Text>
                <Text style={[styles.kpiHero, font.bold, { color: noteColor(accueil.moyenne?.valeur ?? null) }]}>
                  {accueil.moyenne?.valeur != null ? Number(accueil.moyenne.valeur).toFixed(1) : "—"}
                </Text>
                <Text style={[styles.kpiHint, font.medium]}>{noteLabel(accueil.moyenne?.valeur ?? null)} / 20</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${accueil.absences.total} absences. Voir les absences`}
                onPress={() => router.push("/absences")}
                style={({ pressed }) => [styles.kpi, styles.kpiSide, shadow.card, pressStyle(pressed, reduceMotion)]}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[styles.kpiValue, font.bold]}>{accueil.absences.total}</Text>
                <Text style={[styles.kpiLabel, font.medium]}>Absences</Text>
              </Pressable>
            </View>
          </Enter>
        ) : null}

        <Enter index={1}>
          <Card accessibilityLabel="Voir les notes récentes" onPress={() => router.push("/notes")}>
            <View style={styles.panelHead}>
              <Text style={[styles.panelTitle, font.bold]}>Notes récentes</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
            {notesRecentes.map((note) => {
              const value = note.valeur == null ? null : Number(note.valeur);
              return (
                <View key={note.id} style={styles.noteRow}>
                  <View style={[styles.noteMark, { backgroundColor: noteColor(value) }]} />
                  <Text style={[styles.row, font.regular]} numberOfLines={1}>
                    {note.matiere} · {note.evaluation}
                  </Text>
                  <Text style={[styles.noteVal, font.bold, { color: noteColor(value) }]}>
                    {value == null ? "—" : value}
                  </Text>
                </View>
              );
            })}
            {accueil && accueil.notesRecentes.length === 0 ? (
              <Text style={[styles.row, font.regular]}>Aucune note publiée pour le moment.</Text>
            ) : null}
            {accueil && accueil.notesRecentes.length > MAX_NOTES ? (
              <Text style={[styles.more, font.medium]}>Voir toutes les notes</Text>
            ) : null}
          </Card>
        </Enter>

        {!selected ? (
          <EmptyState
            icon="people-outline"
            title="Aucun enfant lié"
            body="Dès que l’établissement associera un élève à ce compte, le suivi apparaîtra ici."
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  scroll: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 96, gap: space.section },
  kicker: { fontSize: 14, color: "rgba(255,255,255,0.78)", letterSpacing: 0.4 },
  hello: { fontSize: 32, color: colors.white, lineHeight: 38, letterSpacing: -0.7, marginBottom: 4 },
  kpis: { flexDirection: "row", gap: 10 },
  kpi: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 14,
  },
  kpiMain: { flex: 1.2, justifyContent: "center", minHeight: 132 },
  kpiSide: { flex: 0.9, alignItems: "flex-start", justifyContent: "center", gap: 4 },
  kpiEyebrow: { fontSize: 12, color: colors.muted },
  kpiHero: { fontSize: 36, fontVariant: ["tabular-nums"], letterSpacing: -1, marginVertical: 4 },
  kpiHint: { fontSize: 13, color: colors.muted },
  kpiValue: { fontSize: 24, color: colors.text, fontVariant: ["tabular-nums"], marginTop: 4 },
  kpiLabel: { fontSize: 12, color: colors.muted },
  panelHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  panelTitle: { fontSize: type.body, color: colors.text },
  row: { fontSize: 15, color: colors.muted, lineHeight: 22, flex: 1 },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 28 },
  noteMark: { width: 4, height: 22, borderRadius: 2 },
  noteVal: { fontSize: type.body, fontVariant: ["tabular-nums"] },
  more: { fontSize: 13, color: colors.primary, marginTop: 8 },
});
