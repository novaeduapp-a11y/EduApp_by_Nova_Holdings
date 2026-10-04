import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchBulletins } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { colors, font, hit, noteColor, radius, type } from "@/lib/theme";

function rangLabel(rang: number) {
  return rang === 1 ? "1er de la classe" : `${rang}e de la classe`;
}

export default function BulletinsScreen() {
  const router = useRouter();
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchBulletins>>["data"]>([]);
  const [periode, setPeriode] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchBulletins(selected.id);
    setRows(res.data);
  }, [selected?.id]);

  const current = useMemo(() => rows.find((row) => row.periode === periode) ?? rows[0] ?? null, [rows, periode]);

  useEffect(() => {
    setPeriode(null);
  }, [selected?.id]);

  useEffect(() => {
    if (periode == null && rows[0]) setPeriode(rows[0].periode);
  }, [rows, periode]);

  useFocusEffect(
    useCallback(() => {
      if (!selected) return;
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les bulletins")))
        .finally(() => setLoading(false));
    }, [load, selected])
  );

  const openBulletin = () => {
    if (!selected || !current) return;
    router.push({
      pathname: "/bulletin",
      params: { eleveId: selected.id, bulletinId: current.id },
    } as unknown as Href);
  };

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Bulletins" switchChild />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour voir ses bulletins."
        />
      </Screen>
    );
  }

  const moyenne = current?.moyenne != null ? Number(current.moyenne) : null;

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
      <PageTitle title="Bulletins" switchChild />

      {rows.length > 1 ? (
        <View style={styles.periodes}>
          {rows.map((row) => (
            <Chip
              key={row.id}
              compact={rows.length <= 3}
              label={row.periode.replace("Trimestre", "Trim.")}
              selected={periode === row.periode}
              onPress={() => setPeriode(row.periode)}
            />
          ))}
        </View>
      ) : null}

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

      {current ? (
        <Enter>
          <Card
            accessibilityLabel={`Voir le bulletin ${current.periode}`}
            onPress={openBulletin}
            style={styles.hero}
          >
            <Text style={[styles.heroKicker, font.medium]}>{current.periode}</Text>
            <View style={styles.heroRow}>
              <View>
                <Text
                  style={[styles.heroValue, font.bold, { color: noteColor(moyenne) }]}
                  accessibilityLabel={
                    moyenne != null
                      ? `Moyenne ${moyenne.toFixed(2)} sur 20, ${current.mention || "sans mention"}`
                      : "Moyenne non calculée"
                  }
                >
                  {moyenne != null ? moyenne.toFixed(2) : "—"}
                </Text>
                <Text style={[styles.heroOut, font.medium]}>/ 20</Text>
              </View>
              <View style={styles.heroSide}>
                {current.mention ? (
                  <View style={styles.mention}>
                    <Text style={[styles.mentionText, font.bold]}>{current.mention}</Text>
                  </View>
                ) : null}
                {current.rang != null ? (
                  <Text style={[styles.rang, font.semibold]}>{rangLabel(current.rang)}</Text>
                ) : null}
              </View>
            </View>
            <Text style={[styles.explain, font.regular]}>
              {current.classe}
              {current.dateGeneration ? ` · publié le ${formatDate(current.dateGeneration)}` : ""}
            </Text>
            <View style={styles.link}>
              <Ionicons name="eye-outline" size={16} color={colors.white} />
              <Text style={[styles.linkText, font.bold]}>Voir le bulletin</Text>
            </View>
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
  periodes: { flexDirection: "row", gap: 8 },
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
  link: {
    minHeight: hit.min,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  linkText: { color: colors.white, fontSize: 15 },
});
