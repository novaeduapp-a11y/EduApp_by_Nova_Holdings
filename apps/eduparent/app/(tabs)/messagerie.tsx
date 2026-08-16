import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useSession } from "@/context/session";
import { fetchMessagerie } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { colors } from "@/lib/theme";

type Fil = Awaited<ReturnType<typeof fetchMessagerie>>["data"]["fils"][number];

export default function MessagerieScreen() {
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [fils, setFils] = useState<Fil[]>([]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetchMessagerie(selected.id)
      .then((res) => setFils(res.data.fils))
      .catch(() => setFils([]))
      .finally(() => setLoading(false));
  }, [selected?.id]);

  if (!selected) {
    return (
      <View style={styles.empty}>
        <ScreenHeader title="Messagerie" />
        <Text style={styles.muted}>Sélectionnez un enfant sur l&apos;accueil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={`Messages · ${selected.prenom}`} />
      <Text style={styles.muted}>Échanges avec les professeurs de {selected.prenom}.</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {fils.map((fil) => (
        <View key={fil.id} style={styles.row}>
          <View style={styles.rowHead}>
            <Text style={styles.name}>{fil.professeur}</Text>
            {fil.nonLus > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{fil.nonLus}</Text>
              </View>
            ) : null}
          </View>
          {fil.matiere ? <Text style={styles.meta}>{fil.matiere}</Text> : null}
          <Text style={styles.muted} numberOfLines={2}>
            {fil.dernierMessage ?? "Aucun message"}
          </Text>
          {fil.date ? <Text style={styles.meta}>{formatDate(fil.date)}</Text> : null}
        </View>
      ))}

      {!loading && fils.length === 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Aucun fil pour le moment</Text>
          <Text style={styles.muted}>
            La messagerie parent–professeur sera branchée en V1.1, dès que le personnel pourra écrire
            depuis EduAdmins. L&apos;écran est prêt : les fils s&apos;afficheront ici automatiquement.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, gap: 12 },
  empty: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 56, gap: 12 },
  row: { backgroundColor: colors.white, borderRadius: 14, padding: 14, gap: 4 },
  rowHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  panel: { backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 8 },
  panelTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13, color: colors.muted },
});
