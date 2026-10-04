import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { NavRow } from "@/components/NavRow";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { matchesQuery, uniqueValues } from "@/lib/filter";
import { formatDate } from "@/lib/format";
import { colors, font, hit, type } from "@/lib/theme";

function typeLabel(kind: string) {
  if (kind === "absence") return "Absence";
  if (kind === "note") return "Note";
  if (kind === "bulletin") return "Bulletin";
  if (kind === "message") return "Message";
  if (kind === "communique_urgent") return "Urgent";
  if (kind === "communique") return "Communiqué";
  if (kind === "convocation") return "Convocation";
  return "Info";
}

export default function PlusScreen() {
  const router = useRouter();
  const { user, refresh, selectChild, selected } = useSession();
  const [notifs, setNotifs] = useState<Awaited<ReturnType<typeof fetchNotifications>>["data"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");

  const load = async () => {
    setError(null);
    const res = await fetchNotifications();
    setNotifs(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err)))
        .finally(() => setLoading(false));
    }, [])
  );

  const openNotif = async (item: (typeof notifs)[number]) => {
    if (!item.readAt) {
      try {
        await markNotificationsRead({ ids: [item.id] });
        await load();
        await refresh();
      } catch {
        /* lecture best-effort */
      }
    }

    const payload = item.data ?? {};
    if (payload.eleveId) selectChild(payload.eleveId);

    if (item.type === "absence") {
      router.push("/absences");
      return;
    }
    if (item.type === "note") {
      router.push("/notes");
      return;
    }
    if (item.type === "bulletin") {
      if (payload.eleveId && payload.bulletinId) {
        router.push({
          pathname: "/bulletin",
          params: { eleveId: payload.eleveId, bulletinId: payload.bulletinId },
        } as unknown as Href);
        return;
      }
      router.push("/bulletins");
      return;
    }
    if (item.type === "message" && payload.filId) {
      router.push({
        pathname: "/conversation",
        params: {
          filId: payload.filId,
          eleveId: payload.eleveId ?? "",
          name: item.title.replace(/^Message de\s+/i, ""),
        },
      } as unknown as Href);
    }
  };

  const markAll = async () => {
    try {
      await markNotificationsRead({ all: true });
      await load();
      await refresh();
    } catch {
      /* lecture best-effort */
    }
  };

  const unread = notifs.filter((item) => !item.readAt).length;
  const kinds = useMemo(() => uniqueValues(notifs.map((item) => item.type)), [notifs]);
  const visibles = useMemo(() => {
    return notifs.filter((item) => {
      if (kind && item.type !== kind) return false;
      return matchesQuery(query, item.title, item.message, typeLabel(item.type));
    });
  }, [notifs, query, kind]);

  return (
    <Screen>
      <PageTitle title="Plus" subtitle={user ? `${user.prenom} ${user.nom}` : "Parent"} switchChild />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Titre, message…"
        accessibilityLabel="Rechercher une notification"
      />
      {kinds.length > 1 ? (
        <View style={styles.kinds}>
          <Chip label="Toutes" selected={kind === ""} onPress={() => setKind("")} />
          {kinds.map((item) => (
            <Chip
              key={item}
              label={typeLabel(item)}
              selected={kind === item}
              onPress={() => setKind(kind === item ? "" : item)}
            />
          ))}
        </View>
      ) : null}

      {loading && notifs.length === 0 && !error ? <Skeleton count={2} /> : null}

      <Enter>
        <Card style={styles.hero}>
          <Text style={[styles.heroKicker, font.medium]}>Notifications</Text>
          <Text style={[styles.heroValue, font.bold]}>
            {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est à jour"}
          </Text>
          {unread > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Marquer toutes les notifications comme lues"
              onPress={markAll}
              style={styles.markAll}
            >
              <Text style={[styles.link, font.bold]}>Tout lire</Text>
            </Pressable>
          ) : (
            <Text style={[styles.explain, font.regular]}>Notes, absences et messages apparaissent ici.</Text>
          )}
        </Card>
      </Enter>

      {error ? (
        <LoadError message={error} onRetry={() => load().catch((err) => setError(loadErrorMessage(err)))} />
      ) : null}

      {!error && notifs.length === 0 && !loading ? (
        <EmptyState
          icon="notifications-outline"
          title="Aucune notification"
          body="Les alertes notes, absences et messages apparaîtront ici."
        />
      ) : visibles.length === 0 && notifs.length > 0 ? (
        <EmptyState icon="search-outline" title="Aucun résultat" body="Essayez un autre mot ou touchez Toutes." />
      ) : (
        visibles.map((item, index) => {
          const unreadItem = !item.readAt;
          return (
            <Enter key={item.id} index={index + 1}>
              <Card
                accessibilityLabel={`${typeLabel(item.type)}. ${item.title}`}
                onPress={() => openNotif(item)}
                style={styles.item}
              >
                <View style={styles.itemHead}>
                  <Text style={[styles.chip, font.bold]}>{typeLabel(item.type)}</Text>
                  {unreadItem ? <View style={styles.dot} accessibilityLabel="Non lue" /> : null}
                </View>
                <Text style={[styles.itemTitle, font.semibold, unreadItem && styles.unread]}>{item.title}</Text>
                <Text style={[styles.muted, font.regular]}>{item.message}</Text>
                <Text style={[styles.meta, font.regular]}>{formatDate(item.createdAt)}</Text>
              </Card>
            </Enter>
          );
        })
      )}

      <Enter index={2}>
        <NavRow
          icon="time-outline"
          title="Emploi du temps"
          subtitle={selected ? `Semaine de ${selected.prenom}` : "Semaine saisie par le préfet"}
          onPress={() => router.push("/edt")}
        />
      </Enter>

      <Enter index={3}>
        <NavRow
          icon="chatbubble-ellipses-outline"
          title="Messagerie"
          subtitle={selected ? `Professeurs de ${selected.prenom}` : "Professeurs de l’enfant"}
          onPress={() => router.push("/messagerie")}
        />
      </Enter>

      <Enter index={4}>
        <NavRow
          icon="settings-outline"
          title="Paramètres"
          subtitle={user ? `${user.prenom} ${user.nom} · profil et établissement` : "Profil, établissement, application"}
          onPress={() => router.push("/parametres")}
        />
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kinds: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  hero: { gap: 4 },
  heroKicker: { fontSize: type.meta, color: colors.muted },
  heroValue: { fontSize: 24, color: colors.text, letterSpacing: -0.3 },
  explain: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  markAll: { minHeight: hit.min, justifyContent: "center" },
  item: { gap: 4 },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { fontSize: 15, color: colors.text },
  unread: { fontFamily: "Outfit_700Bold" },
  chip: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: colors.tint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  link: { color: colors.primary, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  meta: { fontSize: type.meta, color: colors.muted },
});
