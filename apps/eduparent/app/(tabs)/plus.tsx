import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/context/session";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function PlusScreen() {
  const router = useRouter();
  const { logout, user, refresh } = useSession();
  const [notifs, setNotifs] = useState<Awaited<ReturnType<typeof fetchNotifications>>["data"]>([]);

  const load = async () => {
    const res = await fetchNotifications();
    setNotifs(res.data);
  };

  useEffect(() => {
    load().catch(() => setNotifs([]));
  }, []);

  const markOne = async (id: string, alreadyRead: boolean) => {
    if (alreadyRead) return;
    try {
      await markNotificationsRead({ ids: [id] });
      await load();
      await refresh();
    } catch {
      /* lecture best-effort */
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Plus</Text>
      <Text style={styles.muted}>{user ? `${user.prenom} ${user.nom}` : "Parent"}</Text>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>Notifications</Text>
          {unread > 0 ? (
            <Pressable accessibilityRole="button" onPress={markAll} hitSlop={8}>
              <Text style={styles.link}>Tout lire</Text>
            </Pressable>
          ) : null}
        </View>
        {notifs.length === 0 ? (
          <Text style={styles.muted}>Aucune notification pour le moment.</Text>
        ) : (
          notifs.map((item) => {
            const unreadItem = !item.readAt;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => markOne(item.id, !unreadItem)}
                style={styles.item}
              >
                <View style={styles.itemHead}>
                  <Text style={[styles.itemTitle, unreadItem && styles.unread]}>{item.title}</Text>
                  {unreadItem ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.muted}>{item.message}</Text>
                <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/edt")}
        style={({ pressed }) => [styles.nav, pressed && { opacity: 0.8 }]}
      >
        <View>
          <Text style={styles.navTitle}>Emploi du temps</Text>
          <Text style={styles.muted}>Semaine Lundi–Vendredi</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/messagerie")}
        style={({ pressed }) => [styles.nav, pressed && { opacity: 0.8 }]}
      >
        <View>
          <Text style={styles.navTitle}>Messagerie</Text>
          <Text style={styles.muted}>Professeurs de l&apos;enfant</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => logout()}
        style={({ pressed }) => [styles.out, pressed && { transform: [{ scale: 0.96 }] }]}
      >
        <Text style={styles.outText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  panel: { backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 8 },
  panelHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  panelTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  item: { gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 },
  unread: { fontWeight: "700" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  link: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  nav: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 72,
  },
  navTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 },
  chevron: { fontSize: 28, color: colors.muted, fontWeight: "300" },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13, color: colors.muted },
  out: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    marginTop: 8,
  },
  outText: { color: colors.fail, fontWeight: "600", fontSize: 16 },
});
