import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { GradeBadge } from "@/components/GradeBadge";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { ScoreRing } from "@/components/ScoreRing";
import { Screen } from "@/components/Screen";
import { SectionHead } from "@/components/SectionHead";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchBulletins } from "@/lib/api";
import { formatDate, formatNoteFr, rangLabel } from "@/lib/format";
import { colors, font, hit, noteColor, noteSoft, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

type Row = Awaited<ReturnType<typeof fetchBulletins>>["data"][number];

export default function BulletinsScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchBulletins(selected.id);
    setRows(res.data);
  }, [selected?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!selected) return;
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les bulletins")))
        .finally(() => setLoading(false));
    }, [load, selected])
  );

  const open = (row: Row) => {
    if (!selected) return;
    router.push({
      pathname: "/bulletin",
      params: { eleveId: selected.id, bulletinId: row.id },
    } as unknown as Href);
  };

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Bulletins" switchChild showBack />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour voir ses bulletins."
        />
      </Screen>
    );
  }

  const latest = rows[0] ?? null;
  const moyenne = latest?.moyenne != null ? Number(latest.moyenne) : null;

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
      <PageTitle title="Bulletins" switchChild showBack />

      {loading && rows.length === 0 ? <Skeleton count={2} /> : null}
      {error ? (
        <LoadError
          message={error}
          onRetry={() => {
            setLoading(true);
            load()
              .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les bulletins")))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {latest ? (
        <Enter>
          <Card style={styles.hero}>
            <Text style={[styles.kicker, font.medium]}>Dernier bulletin · {latest.periode}</Text>
            <View
              style={styles.heroRow}
              accessible
              accessibilityLabel={`Moyenne ${moyenne != null ? formatNoteFr(moyenne, 2) : "non calculée"} sur 20${latest.mention ? `, ${latest.mention}` : ""}${latest.rang != null ? `, ${rangLabel(latest.rang)}` : ""}`}
            >
              <ScoreRing value={moyenne} size={104} decimals={2} />
              <View style={styles.heroSide}>
                {latest.mention ? (
                  <View style={[styles.mention, { backgroundColor: noteSoft(moyenne) }]}>
                    <Text style={[styles.mentionText, font.bold, { color: noteColor(moyenne) }]}>{latest.mention}</Text>
                  </View>
                ) : null}
                {latest.rang != null ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="podium-outline" size={14} color={colors.muted} />
                    <Text style={[styles.metaStrong, font.semibold]}>{rangLabel(latest.rang)}</Text>
                  </View>
                ) : null}
                <View style={styles.metaRow}>
                  <Ionicons name="school-outline" size={14} color={colors.muted} />
                  <Text style={[styles.meta, font.regular]} numberOfLines={1}>
                    {latest.classe}
                  </Text>
                </View>
                {latest.dateGeneration ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                    <Text style={[styles.meta, font.regular]}>Publié le {formatDate(latest.dateGeneration)}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Voir le bulletin ${latest.periode}`}
              onPress={() => open(latest)}
              style={({ pressed }) => [styles.cta, pressStyle(pressed, reduceMotion)]}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.white} />
              <Text style={[styles.ctaText, font.bold]}>Voir le bulletin</Text>
            </Pressable>
          </Card>
        </Enter>
      ) : null}

      {rows.length > 1 ? (
        <Enter index={1}>
          <Card style={styles.listCard}>
            <SectionHead icon="albums-outline" title="Tous les bulletins" action={`${rows.length}`} chevron={false} />
            {rows.map((row, i) => {
              const value = row.moyenne != null ? Number(row.moyenne) : null;
              return (
                <Pressable
                  key={row.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Bulletin ${row.periode}, moyenne ${value != null ? formatNoteFr(value, 2) : "non calculée"}`}
                  onPress={() => open(row)}
                  style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, font.semibold]}>{row.periode}</Text>
                    <Text style={[styles.meta, font.regular]} numberOfLines={1}>
                      {[row.rang != null ? `Rang ${row.rang}` : null, row.mention, formatDate(row.dateGeneration)]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                  <GradeBadge value={value} label={value != null ? formatNoteFr(value, 2) : "—"} />
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              );
            })}
          </Card>
        </Enter>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Aucun bulletin"
          body={`Les bulletins de ${selected.prenom} seront disponibles ici dès leur publication.`}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 14 },
  kicker: { fontSize: type.meta, color: colors.muted },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroSide: { flex: 1, alignItems: "flex-start", gap: 6 },
  mention: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 2 },
  mentionText: { fontSize: 14 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaStrong: { fontSize: 13, color: colors.text },
  meta: { fontSize: type.meta, color: colors.muted, flexShrink: 1 },
  cta: {
    minHeight: hit.min + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingHorizontal: 14,
  },
  ctaText: { color: colors.white, fontSize: 15 },
  listCard: { paddingBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 60, paddingVertical: 8 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowPressed: { opacity: 0.6 },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, color: colors.text },
});
