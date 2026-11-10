import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PortalHeader } from "@/components/PortalHeader";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchMessagerie } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { initials, relativeTime } from "@/lib/format";
import { colors, font, subjectColor, type } from "@/lib/theme";

type Fil = Awaited<ReturnType<typeof fetchMessagerie>>["data"]["fils"][number];

export default function MessagerieScreen() {
  const router = useRouter();
  const { selected, setMessagesUnread } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fils, setFils] = useState<Fil[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchMessagerie(selected.id);
    setFils(res.data.fils);
    setMessagesUnread(res.data.fils.reduce((sum, fil) => sum + (fil.nonLus || 0), 0));
  }, [selected?.id, setMessagesUnread]);

  useFocusEffect(
    useCallback(() => {
      if (!selected) return;
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err)))
        .finally(() => setLoading(false));
    }, [load, selected])
  );

  const visibles = useMemo(
    () => fils.filter((fil) => matchesQuery(query, fil.professeur, fil.matiere, fil.dernierMessage)),
    [fils, query]
  );
  const conversations = useMemo(
    () =>
      visibles
        .filter((fil) => fil.id && fil.dernierMessage)
        .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()),
    [visibles]
  );
  const contacts = useMemo(() => visibles.filter((fil) => !fil.id || !fil.dernierMessage), [visibles]);
  const unread = fils.reduce((sum, fil) => sum + (fil.nonLus ?? 0), 0);

  const open = (fil: Fil) => {
    if (!selected) return;
    router.push({
      pathname: "/conversation",
      params: {
        filId: fil.id ?? "new",
        professeurId: fil.professeurId,
        name: fil.professeur,
        matiere: fil.matiere ?? "",
        eleveId: selected.id,
      },
    } as unknown as Href);
  };

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PortalHeader />
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
      <PortalHeader
        subtitle={
          unread > 0
            ? `${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}`
            : `Professeurs de ${selected.prenom}`
        }
      />

      {fils.length > 3 ? (
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Professeur, matière…"
          accessibilityLabel="Rechercher une conversation"
        />
      ) : null}

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

      {conversations.length > 0 ? (
        <Enter>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, font.medium]}>Conversations</Text>
            <Card style={styles.list}>
              {conversations.map((fil, i) => (
                <ThreadRow key={fil.professeurId} fil={fil} first={i === 0} onPress={() => open(fil)} />
              ))}
            </Card>
          </View>
        </Enter>
      ) : null}

      {contacts.length > 0 ? (
        <Enter index={1}>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, font.medium]}>
              {conversations.length > 0 ? "Écrire à un autre professeur" : "Écrire à un professeur"}
            </Text>
            <Card style={styles.list}>
              {contacts.map((fil, i) => (
                <ContactRow key={fil.professeurId} fil={fil} first={i === 0} onPress={() => open(fil)} />
              ))}
            </Card>
          </View>
        </Enter>
      ) : null}

      {!loading && !error && fils.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Aucun professeur lié"
          body={`Les professeurs de la classe de ${selected.prenom} apparaîtront ici dès qu’ils seront affectés.`}
        />
      ) : null}
      {!loading && !error && fils.length > 0 && visibles.length === 0 ? (
        <EmptyState icon="search-outline" title="Aucun résultat" body="Essayez le nom du professeur ou de la matière." />
      ) : null}
    </Screen>
  );
}

function ThreadRow({ fil, first, onPress }: { fil: Fil; first: boolean; onPress: () => void }) {
  const tone = subjectColor(fil.matiere ?? fil.professeur);
  const unread = fil.nonLus > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversation avec ${fil.professeur}${fil.matiere ? `, ${fil.matiere}` : ""}${unread ? `, ${fil.nonLus} non lu${fil.nonLus > 1 ? "s" : ""}` : ""}. Dernier message : ${fil.dernierMessage ?? ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}
    >
      <Avatar name={fil.professeur} label={initials(fil.professeur)} tone={tone} size={48} />
      <View style={styles.copy}>
        <View style={styles.head}>
          <Text style={[styles.name, font.bold]} numberOfLines={1}>
            {fil.professeur}
          </Text>
          {fil.date ? (
            <Text style={[styles.time, unread ? font.bold : font.regular, unread && { color: colors.primary }]}>
              {relativeTime(fil.date)}
            </Text>
          ) : null}
        </View>
        {fil.matiere ? (
          <Text style={[styles.subject, font.semibold, { color: tone.fg }]} numberOfLines={1}>
            {fil.matiere}
          </Text>
        ) : null}
        <View style={styles.head}>
          <Text
            style={[styles.preview, unread ? [font.semibold, { color: colors.text }] : font.regular]}
            numberOfLines={1}
          >
            {fil.dernierMessage}
          </Text>
          {unread ? (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, font.bold]}>{fil.nonLus > 9 ? "9+" : fil.nonLus}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ContactRow({ fil, first, onPress }: { fil: Fil; first: boolean; onPress: () => void }) {
  const tone = subjectColor(fil.matiere ?? fil.professeur);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Écrire à ${fil.professeur}${fil.matiere ? `, ${fil.matiere}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, styles.rowCompact, !first && styles.divider, pressed && styles.pressed]}
    >
      <Avatar name={fil.professeur} label={initials(fil.professeur)} tone={tone} size={40} />
      <View style={styles.copy}>
        <Text style={[styles.name, font.semibold]} numberOfLines={1}>
          {fil.professeur}
        </Text>
        {fil.matiere ? (
          <Text style={[styles.time, font.regular]} numberOfLines={1}>
            {fil.matiere}
          </Text>
        ) : null}
      </View>
      <View style={styles.write}>
        <Ionicons name="create-outline" size={18} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionLabel: { fontSize: type.meta, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginStart: 4 },
  list: { paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowCompact: { paddingVertical: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  copy: { flex: 1, gap: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 15, color: colors.text },
  time: { fontSize: 12, color: colors.muted },
  subject: { fontSize: 12 },
  preview: { flex: 1, fontSize: 14, color: colors.muted, marginTop: 2 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.white, fontSize: 11, fontVariant: ["tabular-nums"] },
  write: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
});
