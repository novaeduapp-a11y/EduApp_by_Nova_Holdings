import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { NavRow } from "@/components/NavRow";
import { PortalHeader } from "@/components/PortalHeader";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchAccueil, fetchBulletins } from "@/lib/api";
import { formatDate, formatNoteFr, rangLabel } from "@/lib/format";
import { colors, font, pressStyle, radius, space, type, useReduceMotion } from "@/lib/theme";

type Accueil = Awaited<ReturnType<typeof fetchAccueil>>["data"];

export default function AccueilScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { user, selected, unreadCount } = useSession();
  const [accueil, setAccueil] = useState<Accueil | null>(null);
  const [bulletin, setBulletin] = useState<Awaited<ReturnType<typeof fetchBulletins>>["data"][number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selected) {
      setAccueil(null);
      setBulletin(null);
      return;
    }
    setError(null);
    const [a, b] = await Promise.all([
      fetchAccueil(selected.id),
      fetchBulletins(selected.id).catch(() => null),
    ]);
    setAccueil(a.data);
    setBulletin(b?.data?.[0] ?? null);
  }, [selected?.id]);

  const runLoad = useCallback(() => {
    if (!selected) return;
    setLoading(true);
    load()
      .catch((err) => setError(loadErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [load, selected]);

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

  const moyenne = accueil?.moyenne?.valeur != null ? Number(accueil.moyenne.valeur) : null;
  const rang = accueil?.moyenne?.rang;
  const absencesJours = accueil?.absences.total ?? 0;
  const matieres = accueil?.matieresSuivies ?? 0;
  const parentLabel = user?.prenom ?? "Parent";

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
      <PortalHeader />

      {loading && !accueil ? <Skeleton count={3} /> : null}
      {error ? <LoadError message={error} onRetry={runLoad} /> : null}

      {accueil && (unreadCount > 0 || bulletin) ? (
        <Enter>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voir les alertes"
            onPress={() => {
              if (bulletin && unreadCount === 0) {
                router.push({
                  pathname: "/bulletin",
                  params: { eleveId: selected?.id ?? "", bulletinId: bulletin.id },
                } as unknown as Href);
                return;
              }
              router.push("/notifications" as Href);
            }}
            style={({ pressed }) => [styles.banner, pressStyle(pressed, reduceMotion)]}
          >
            <Text style={[styles.bannerText, font.regular]}>
              Bonjour {parentLabel} !{" "}
              {unreadCount > 0 ? (
                <>
                  Vous avez{" "}
                  <Text style={[styles.bannerLink, font.semibold]}>
                    {unreadCount} notification{unreadCount > 1 ? "s" : ""}
                  </Text>
                  .
                </>
              ) : bulletin ? (
                <>
                  {selected?.prenom} a{" "}
                  <Text style={[styles.bannerLink, font.semibold]}>un nouveau bulletin</Text>. Consultez ses
                  résultats.
                </>
              ) : null}
            </Text>
          </Pressable>
        </Enter>
      ) : null}

      {accueil ? (
        <Enter index={1}>
          <Text style={[styles.sectionLabel, font.bold]}>APERÇU</Text>
          <View style={styles.grid}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voir les notes"
              onPress={() => router.push("/notes")}
              style={({ pressed }) => [styles.kpi, pressStyle(pressed, reduceMotion)]}
            >
              <View style={[styles.kpiIcon, { backgroundColor: colors.tint }]}>
                <Ionicons name="bar-chart" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.kpiValue, font.bold, { color: colors.primary }]}>
                {moyenne != null ? `${formatNoteFr(moyenne)} / 20` : "—"}
              </Text>
              <Text style={[styles.kpiLabel, font.medium]}>Moyenne</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voir les notes"
              onPress={() => router.push("/notes")}
              style={({ pressed }) => [styles.kpi, pressStyle(pressed, reduceMotion)]}
            >
              <View style={[styles.kpiIcon, { backgroundColor: colors.tint }]}>
                <Ionicons name="trophy" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.kpiValue, font.bold, { color: colors.primary }]}>
                {rang != null ? rangLabel(rang, false) : "—"}
              </Text>
              <Text style={[styles.kpiLabel, font.medium]}>Rang</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voir les absences"
              onPress={() => router.push("/absences")}
              style={({ pressed }) => [styles.kpi, pressStyle(pressed, reduceMotion)]}
            >
              <View style={[styles.kpiIcon, { backgroundColor: colors.failSoft }]}>
                <Ionicons name="calendar" size={18} color={colors.fail} />
              </View>
              <Text style={[styles.kpiValue, font.bold, { color: colors.fail }]}>
                {absencesJours} jour{absencesJours > 1 ? "s" : ""}
              </Text>
              <Text style={[styles.kpiLabel, font.medium]}>Absences</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voir les notes par matière"
              onPress={() => router.push("/notes")}
              style={({ pressed }) => [styles.kpi, pressStyle(pressed, reduceMotion)]}
            >
              <View style={[styles.kpiIcon, { backgroundColor: colors.tint }]}>
                <Ionicons name="book" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.kpiValue, font.bold, { color: colors.primary }]}>
                {matieres} suivie{matieres > 1 ? "s" : ""}
              </Text>
              <Text style={[styles.kpiLabel, font.medium]}>Matières</Text>
            </Pressable>
          </View>
        </Enter>
      ) : null}

      {accueil ? (
        <Enter index={2}>
          <Text style={[styles.sectionLabel, font.bold]}>ACCÈS RAPIDE</Text>
          <Card accessibilityLabel="Voir l’emploi du temps" onPress={() => router.push("/edt")}>
            <View style={styles.edtRow}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.tint }]}>
                <Ionicons name="document-text" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.edtTitle, font.bold]}>Voir l’emploi du temps</Text>
                <Text style={[styles.edtMeta, font.regular]}>
                  Aujourd’hui · {accueil.coursDuJour.length} cours
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </Card>
        </Enter>
      ) : null}

      {accueil ? (
        <Enter index={3}>
          <View style={styles.links}>
            <NavRow
              icon="document-text-outline"
              title="Bulletins"
              subtitle={
                bulletin
                  ? `${bulletin.periode}${bulletin.dateGeneration ? ` · ${formatDate(bulletin.dateGeneration)}` : ""}`
                  : "Consulter les bulletins"
              }
              onPress={() => router.push("/bulletins")}
            />
            <NavRow
              icon="calendar-outline"
              title="Absences"
              subtitle={
                accueil.absences.nonJustifiees > 0
                  ? `${accueil.absences.nonJustifiees} à justifier`
                  : `${accueil.absences.total} absence${accueil.absences.total > 1 ? "s" : ""}`
              }
              onPress={() => router.push("/absences")}
            />
          </View>
        </Enter>
      ) : null}

      {!selected ? (
        <EmptyState
          icon="people-outline"
          title="Aucun enfant lié"
          body="Dès que l’établissement associera un élève à ce compte, le suivi apparaîtra ici."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  banner: {
    borderRadius: radius.card,
    backgroundColor: colors.tint,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  bannerText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  bannerLink: { color: colors.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: {
    width: "47.5%",
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 14,
    gap: 8,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontSize: 20, fontVariant: ["tabular-nums"] },
  kpiLabel: { fontSize: 13, color: colors.muted },
  edtRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  edtTitle: { fontSize: type.body, color: colors.text },
  edtMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  links: { gap: space.group },
});
