import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter, useSegments, type Href } from "expo-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { PortalHeader } from "@/components/PortalHeader";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { periodBucket, relativeTime } from "@/lib/format";
import { colors, font, hit, pressStyle, type, useReduceMotion } from "@/lib/theme";

type Notif = Awaited<ReturnType<typeof fetchNotifications>>["data"][number];
type IconName = keyof typeof Ionicons.glyphMap;

const KINDS: Record<string, { label: string; icon: IconName; fg: string; bg: string }> = {
  absence: { label: "Absence", icon: "calendar-outline", fg: colors.fail, bg: colors.failSoft },
  retard: { label: "Retard", icon: "time-outline", fg: "#B45309", bg: "#FDF0E1" },
  note: { label: "Note", icon: "star-outline", fg: colors.good, bg: colors.goodSoft },
  bulletin: { label: "Bulletin", icon: "document-text-outline", fg: "#6D3FC4", bg: "#F0EAFB" },
  message: { label: "Message", icon: "chatbubble-ellipses-outline", fg: colors.primary, bg: colors.tint },
  communique_urgent: { label: "Urgent", icon: "alert-circle-outline", fg: colors.fail, bg: colors.failSoft },
  communique: { label: "Communiqué", icon: "megaphone-outline", fg: "#B45309", bg: "#FDF0E1" },
  convocation: { label: "Convocation", icon: "people-outline", fg: "#0F766E", bg: "#E0F3F1" },
};
const FALLBACK = { label: "Info", icon: "information-circle-outline" as IconName, fg: colors.muted, bg: colors.background };
const BUCKETS = ["Aujourd’hui", "Hier", "Cette semaine", "Plus ancien"] as const;

type CategoryKey = "notes" | "absences" | "messages" | "ecole";
const CATEGORIES: Array<{ key: CategoryKey; label: string; icon: IconName; fg: string; bg: string; types: string[] }> = [
  { key: "notes", label: "Notes", icon: "star-outline", fg: colors.good, bg: colors.goodSoft, types: ["note", "bulletin"] },
  { key: "absences", label: "Absences", icon: "calendar-outline", fg: colors.fail, bg: colors.failSoft, types: ["absence", "retard"] },
  {
    key: "messages",
    label: "Messages",
    icon: "chatbubble-ellipses-outline",
    fg: colors.primary,
    bg: colors.tint,
    types: ["message"],
  },
  {
    key: "ecole",
    label: "École",
    icon: "megaphone-outline",
    fg: "#B45309",
    bg: "#FDF0E1",
    types: ["communique", "communique_urgent", "convocation"],
  },
];

function kindOf(kind: string) {
  return KINDS[kind] ?? FALLBACK;
}

function categoryOf(kind: string): CategoryKey | null {
  return CATEGORIES.find((c) => c.types.includes(kind))?.key ?? null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const segments = useSegments();
  const asTab = segments.some((s) => s === "notifs");
  const reduceMotion = useReduceMotion();
  const { refresh, selectChild } = useSession();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

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

  const openNotif = async (item: Notif) => {
    if (!item.readAt) {
      setNotifs((list) => list.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
      markNotificationsRead({ ids: [item.id] })
        .then(() => refresh())
        .catch(() => undefined);
    }

    const payload = item.data ?? {};
    if (payload.eleveId) selectChild(payload.eleveId);

    if (item.type === "absence" || item.type === "retard") return router.push("/absences");
    if (item.type === "note") return router.push("/notes");
    if (item.type === "bulletin") {
      if (payload.eleveId && payload.bulletinId) {
        return router.push({
          pathname: "/bulletin",
          params: { eleveId: payload.eleveId, bulletinId: payload.bulletinId },
        } as unknown as Href);
      }
      return router.push("/bulletins");
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
      return;
    }
    if (item.type === "convocation" && payload.convocationId) {
      return router.push({
        pathname: "/convocation",
        params: { id: payload.convocationId, notificationId: item.id },
      } as unknown as Href);
    }
    if ((item.type === "communique" || item.type === "communique_urgent") && payload.communiqueId) {
      return router.push({
        pathname: "/communique",
        params: { id: payload.communiqueId, notificationId: item.id },
      } as unknown as Href);
    }
  };

  const markAll = async () => {
    setNotifs((list) => list.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    try {
      await markNotificationsRead({ all: true });
      await refresh();
    } catch {
      await load().catch(() => undefined);
    }
  };

  const unread = notifs.filter((item) => !item.readAt).length;
  const scope = useMemo(() => notifs.filter((item) => !unreadOnly || !item.readAt), [notifs, unreadOnly]);
  const counts = useMemo(() => {
    const map: Record<CategoryKey, number> = { notes: 0, absences: 0, messages: 0, ecole: 0 };
    for (const item of scope) {
      const key = categoryOf(item.type);
      if (key) map[key] += 1;
    }
    return map;
  }, [scope]);
  const presentCategories = useMemo(
    () => CATEGORIES.filter((c) => notifs.some((item) => c.types.includes(item.type))),
    [notifs]
  );
  const visibles = useMemo(
    () => scope.filter((item) => !category || categoryOf(item.type) === category),
    [scope, category]
  );
  const groups = useMemo(() => {
    const map = new Map<string, Notif[]>();
    for (const item of visibles) {
      const key = periodBucket(item.createdAt);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return BUCKETS.filter((b) => map.has(b)).map((b) => [b, map.get(b)!] as const);
  }, [visibles]);

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
      {asTab ? <PortalHeader /> : null}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          {asTab ? (
            <View style={styles.tabHead}>
              {unread > 0 ? (
                <View style={styles.unreadPill}>
                  <Text style={[styles.unreadPillText, font.bold]}>
                    {unread} non lue{unread > 1 ? "s" : ""}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.tabSub, font.regular]}>Tout est à jour</Text>
              )}
            </View>
          ) : (
            <PageTitle
              title="Notifications"
              subtitle={unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est à jour"}
              showBack
            />
          )}
        </View>
        {unread > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Marquer toutes les notifications comme lues"
            onPress={markAll}
            style={({ pressed }) => [styles.markAll, pressStyle(pressed, reduceMotion)]}
          >
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={[styles.markAllText, font.semibold]}>Tout marquer lu</Text>
          </Pressable>
        ) : null}
      </View>

      {notifs.length > 0 ? (
        <View style={styles.filters}>
          <View style={styles.segment} accessibilityRole="tablist">
            {[
              { on: !unreadOnly, label: "Toutes", count: notifs.length, value: false },
              { on: unreadOnly, label: "Non lues", count: unread, value: true },
            ].map((tab) => (
              <Pressable
                key={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab.on }}
                accessibilityLabel={`${tab.label}, ${tab.count}`}
                onPress={() => setUnreadOnly(tab.value)}
                style={[styles.segmentItem, tab.on && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, tab.on ? font.bold : font.medium, tab.on && { color: colors.primary }]}>
                  {tab.label}
                </Text>
                <View style={[styles.count, tab.on && styles.countOn]}>
                  <Text style={[styles.countText, font.bold, tab.on && { color: colors.white }]}>{tab.count}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {presentCategories.length > 1 ? (
            <View style={styles.categories}>
              {presentCategories.map((c) => {
                const on = category === c.key;
                const count = counts[c.key];
                return (
                  <Pressable
                    key={c.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${c.label}, ${count}${on ? ", filtre actif" : ""}`}
                    onPress={() => setCategory(on ? null : c.key)}
                    style={({ pressed }) => [
                      styles.category,
                      on && { backgroundColor: c.bg, borderColor: c.fg },
                      pressStyle(pressed, reduceMotion),
                    ]}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: on ? colors.white : c.bg }]}>
                      <Ionicons name={c.icon} size={16} color={c.fg} />
                    </View>
                    <Text style={[styles.categoryText, font.semibold, on && { color: c.fg }]} numberOfLines={1}>
                      {c.label}
                    </Text>
                    <Text style={[styles.categoryCount, font.bold, { color: count > 0 ? c.fg : colors.muted }]}>
                      {count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {loading && notifs.length === 0 && !error ? <Skeleton count={3} /> : null}
      {error ? (
        <LoadError message={error} onRetry={() => load().catch((err) => setError(loadErrorMessage(err)))} />
      ) : null}

      {groups.map(([bucket, items], groupIndex) => (
        <Enter key={bucket} index={groupIndex}>
          <View style={styles.group}>
            <Text style={[styles.groupLabel, font.medium]}>{bucket}</Text>
            <Card style={styles.list}>
              {items.map((item, i) => {
                const meta = kindOf(item.type);
                const isUnread = !item.readAt;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${meta.label}${isUnread ? ", non lue" : ""}. ${item.title}. ${item.message}`}
                    onPress={() => openNotif(item)}
                    style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
                  >
                    <View style={[styles.icon, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.fg} />
                    </View>
                    <View style={styles.copy}>
                      <View style={styles.head}>
                        <Text style={[styles.kind, font.semibold, { color: meta.fg }]}>{meta.label}</Text>
                        <Text style={[styles.time, font.regular]}>{relativeTime(item.createdAt)}</Text>
                      </View>
                      <Text
                        style={[styles.title, isUnread ? font.bold : font.semibold]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      {typeof item.data?.auteur === "string" && item.data.auteur ? (
                        <Text style={[styles.author, font.medium]} numberOfLines={1}>
                          Par {item.data.auteur}
                        </Text>
                      ) : null}
                      {item.message.trim() &&
                      item.message.trim().toLowerCase() !== item.title.trim().toLowerCase() ? (
                        <Text style={[styles.message, font.regular]} numberOfLines={2}>
                          {item.message}
                        </Text>
                      ) : null}
                    </View>
                    {isUnread ? <View style={styles.dot} accessibilityElementsHidden /> : <View style={styles.dotSpace} />}
                  </Pressable>
                );
              })}
            </Card>
          </View>
        </Enter>
      ))}

      {!error && notifs.length === 0 && !loading ? (
        <EmptyState
          icon="notifications-outline"
          title="Aucune notification"
          body="Les alertes notes, absences et messages apparaîtront ici."
        />
      ) : null}
      {!error && notifs.length > 0 && visibles.length === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title={unreadOnly ? "Tout est lu" : "Rien ici"}
          body={
            unreadOnly
              ? "Aucune notification non lue dans cette catégorie."
              : "Aucune notification dans cette catégorie."
          }
        />
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tabHead: { minHeight: 36, justifyContent: "center" },
  tabSub: { fontSize: 15, color: colors.muted },
  unreadPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.failSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unreadPillText: { fontSize: 13, color: colors.fail },
  markAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: hit.min,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: colors.tint,
  },
  markAllText: { fontSize: 14, color: colors.primary },
  author: { fontSize: 13, color: colors.primary, marginTop: 2 },
  filters: { gap: 10 },
  segment: { flexDirection: "row", padding: 4, gap: 4, borderRadius: 16, backgroundColor: colors.white },
  segmentItem: {
    flex: 1,
    minHeight: hit.min - 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  segmentOn: { backgroundColor: colors.tint },
  segmentText: { fontSize: 14, color: colors.muted },
  count: { minWidth: 22, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  countOn: { backgroundColor: colors.primary },
  countText: { fontSize: 11, color: colors.muted, fontVariant: ["tabular-nums"] },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  category: {
    flexGrow: 1,
    flexBasis: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: hit.min + 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: colors.white,
  },
  categoryIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  categoryText: { flex: 1, fontSize: 14, color: colors.text },
  categoryCount: { fontSize: 14, fontVariant: ["tabular-nums"] },
  group: { gap: 8 },
  groupLabel: { fontSize: type.meta, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginStart: 4 },
  list: { paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  kind: { flex: 1, fontSize: 12 },
  time: { fontSize: 12, color: colors.muted },
  title: { fontSize: 15, color: colors.text, lineHeight: 20 },
  message: { fontSize: 14, color: colors.muted, lineHeight: 19 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
  dotSpace: { width: 9 },
});
