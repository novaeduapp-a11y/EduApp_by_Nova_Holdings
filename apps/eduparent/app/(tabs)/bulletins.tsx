import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Sharing from "expo-sharing";
import { useSession } from "@/context/session";
import { downloadBulletinPdf, fetchBulletins } from "@/lib/api";
import { safeFileName } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function BulletinsScreen() {
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchBulletins>>["data"]>([]);

  const load = async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchBulletins(selected.id);
    setRows(res.data);
  };

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les bulletins"))
      .finally(() => setLoading(false));
  }, [selected?.id]);

  const openPdf = async (bulletinId: string, periode: string) => {
    if (!selected) return;
    setOpeningId(bulletinId);
    try {
      const filename = safeFileName(`bulletin-${selected.prenom}-${periode}.pdf`);
      const uri = await downloadBulletinPdf(selected.id, bulletinId, filename);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: `Bulletin ${periode}`,
        });
      } else {
        Alert.alert("Bulletin prêt", "Le fichier a été enregistré dans le cache de l'application.");
      }
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Ouverture du PDF impossible");
    } finally {
      setOpeningId(null);
    }
  };

  if (!selected) {
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>Sélectionnez un enfant sur l&apos;accueil.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await load();
            } finally {
              setRefreshing(false);
            }
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>Bulletins · {selected.prenom}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {rows.map((bulletin) => (
        <View key={bulletin.id} style={styles.row}>
          <Text style={styles.periode}>{bulletin.periode}</Text>
          <Text style={styles.meta}>
            {bulletin.moyenne != null ? `Moyenne ${Number(bulletin.moyenne).toFixed(2)}` : "Moyenne non calculée"}
            {bulletin.mention ? ` · ${bulletin.mention}` : ""}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => openPdf(bulletin.id, bulletin.periode)}
            disabled={openingId === bulletin.id}
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.linkText}>
              {openingId === bulletin.id ? "Préparation du PDF..." : "Ouvrir le PDF"}
            </Text>
          </Pressable>
        </View>
      ))}
      {!loading && rows.length === 0 ? <Text style={styles.muted}>Aucun bulletin pour le moment.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56, gap: 10 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  row: { backgroundColor: colors.white, borderRadius: 14, padding: 14, gap: 6 },
  periode: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
  error: { color: colors.fail },
  empty: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 },
  muted: { color: colors.muted, fontSize: 15 },
});
