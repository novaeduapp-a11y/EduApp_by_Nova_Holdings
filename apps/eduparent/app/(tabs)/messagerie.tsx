import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchMessagerie } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { formatDate } from "@/lib/format";
import { colors, font, type } from "@/lib/theme";

type Fil = Awaited<ReturnType<typeof fetchMessagerie>>["data"]["fils"][number];

export default function MessagerieScreen() {
  const router = useRouter();
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [fils, setFils] = useState<Fil[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchMessagerie(selected.id);
    setFils(res.data.fils);
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

  const unread = fils.reduce((sum, fil) => sum + (fil.nonLus ?? 0), 0);
  const filsVisibles = useMemo(
    () => fils.filter((fil) => matchesQuery(query, fil.professeur, fil.matiere, fil.dernierMessage)),
    [fils, query]
  );

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Messages" switchChild showBack />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour écrire aux professeurs."
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={loading && fils.length > 0}
      onRefresh={() => load().catch((err) => setError(loadErrorMessage(err)))}
    >
      <PageTitle title="Messages" switchChild showBack />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Professeur, matière…"
        accessibilityLabel="Rechercher une conversation"
      />

      {loading && fils.length === 0 ? <Skeleton count={3} /> : null}
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

      {fils.length > 0 ? (
        <Enter>
          <Card style={styles.hero}>
            <Text style={[styles.heroKicker, font.medium]}>Professeurs de {selected.prenom}</Text>
            <Text style={[styles.heroValue, font.bold]}>
              {unread > 0 ? `${unread} non lu${unread > 1 ? "s" : ""}` : "Tout est lu"}
            </Text>
            <Text style={[styles.explain, font.regular]}>
              {fils.length} conversation{fils.length > 1 ? "s" : ""} · répondez depuis cette page
            </Text>
          </Card>
        </Enter>
      ) : null}

      {filsVisibles.map((fil, index) => (
        <Enter key={fil.professeurId} index={index + 1}>
          <Card
            accessibilityLabel={`Conversation avec ${fil.professeur}`}
            onPress={() => {
              router.push({
                pathname: "/conversation",
                params: {
                  filId: fil.id ?? "new",
                  professeurId: fil.professeurId,
                  name: fil.professeur,
                  eleveId: selected.id,
                },
              } as unknown as Href);
            }}
            style={styles.row}
          >
            <View style={styles.avatar}>
              <Text style={[styles.initial, font.bold]}>{fil.professeur.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowHead}>
                <Text style={[styles.name, font.bold]} numberOfLines={1}>
                  {fil.professeur}
                </Text>
                {fil.nonLus > 0 ? (
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, font.bold]}>{fil.nonLus}</Text>
                  </View>
                ) : null}
              </View>
              {fil.matiere ? <Text style={[styles.meta, font.medium]}>{fil.matiere}</Text> : null}
              <Text style={[styles.muted, font.regular]} numberOfLines={2}>
                {fil.dernierMessage ?? "Écrire un message"}
              </Text>
              {fil.date ? <Text style={[styles.meta, font.regular]}>{formatDate(fil.date)}</Text> : null}
            </View>
          </Card>
        </Enter>
      ))}

      {!loading && !error && fils.length === 0 ? (
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="Aucun professeur lié"
          body={`Les professeurs de la classe de ${selected.prenom} apparaîtront ici dès qu’ils seront affectés.`}
        />
      ) : null}
      {!loading && !error && fils.length > 0 && filsVisibles.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Aucun résultat"
          body="Essayez le nom du professeur ou de la matière."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 4 },
  heroKicker: { fontSize: type.meta, color: colors.muted },
  heroValue: { fontSize: 24, color: colors.text, letterSpacing: -0.3 },
  explain: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 18, color: colors.primary },
  rowHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: type.body, color: colors.text },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 12, fontVariant: ["tabular-nums"] },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  meta: { fontSize: type.meta, color: colors.muted, marginTop: 2 },
});
