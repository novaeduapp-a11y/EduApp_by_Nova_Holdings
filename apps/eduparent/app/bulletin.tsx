import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/Skeleton";
import { downloadBulletinPdf, fetchBulletin } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { safeFileName } from "@/lib/format";
import { colors, font, hit, noteColor, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

function rangLabel(rang: number, effectif: number) {
  const place = rang === 1 ? "1er" : `${rang}e`;
  return `${place} / ${effectif}`;
}

export default function BulletinScreen() {
  const reduceMotion = useReduceMotion();
  const params = useLocalSearchParams<{ eleveId?: string; bulletinId?: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulletin, setBulletin] = useState<Awaited<ReturnType<typeof fetchBulletin>>["data"] | null>(null);
  const [query, setQuery] = useState("");

  const notes = useMemo(
    () =>
      (bulletin?.notes ?? []).filter((note) =>
        matchesQuery(query, note.matiere, note.appreciation, String(note.moyenne), String(note.coefficient))
      ),
    [bulletin, query]
  );

  const load = useCallback(async () => {
    if (!params.eleveId || !params.bulletinId) return;
    setError(null);
    const res = await fetchBulletin(params.eleveId, params.bulletinId);
    setBulletin(res.data);
  }, [params.eleveId, params.bulletinId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(loadErrorMessage(err, "Impossible d’ouvrir le bulletin")))
      .finally(() => setLoading(false));
  }, [load]);

  const download = async () => {
    if (!params.eleveId || !params.bulletinId || !bulletin) return;
    setSaving(true);
    try {
      const filename = safeFileName(`bulletin-${bulletin.eleve.prenom}-${bulletin.periode.nom}.pdf`);
      const uri = await downloadBulletinPdf(params.eleveId, params.bulletinId, filename);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: `Bulletin ${bulletin.periode.nom}`,
        });
      } else {
        Alert.alert("PDF prêt", "Le fichier a été enregistré dans le cache de l’application.");
      }
    } catch (err) {
      Alert.alert("Téléchargement impossible", err instanceof Error ? err.message : "Réessayez dans un instant.");
    } finally {
      setSaving(false);
    }
  };

  if (!params.eleveId || !params.bulletinId) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Bulletin" showBack />
        <EmptyState icon="document-text-outline" title="Bulletin introuvable" body="Revenez à la liste et ouvrez-le à nouveau." />
      </Screen>
    );
  }

  return (
    <Screen
      onRefresh={async () => {
        try {
          await load();
        } catch (err) {
          setError(loadErrorMessage(err, "Impossible d’ouvrir le bulletin"));
        }
      }}
    >
      <PageTitle title={bulletin?.periode.nom ?? "Bulletin"} showBack />

      {loading && !bulletin ? <Skeleton count={4} /> : null}
      {error ? (
        <LoadError
          message={error}
          onRetry={() => {
            setLoading(true);
            load()
              .catch((err) => setError(loadErrorMessage(err, "Impossible d’ouvrir le bulletin")))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {bulletin ? (
        <>
          <Enter>
            <Card style={styles.hero}>
              <Text style={[styles.kicker, font.medium]}>{bulletin.ecole.nom}</Text>
              <Text style={[styles.heroName, font.bold]}>
                {bulletin.eleve.prenom} {bulletin.eleve.nom}
              </Text>
              <Text style={[styles.meta, font.regular]}>
                {bulletin.eleve.classe} · {bulletin.eleve.matricule} · {bulletin.periode.anneeScolaire}
              </Text>
              <View style={styles.heroRow}>
                <View>
                  <Text
                    style={[styles.heroValue, font.bold, { color: noteColor(bulletin.moyenneGenerale) }]}
                    accessibilityLabel={`Moyenne ${bulletin.moyenneGenerale.toFixed(2)} sur 20`}
                  >
                    {bulletin.moyenneGenerale.toFixed(2)}
                  </Text>
                  <Text style={[styles.heroOut, font.medium]}>/ 20</Text>
                </View>
                <View style={styles.heroSide}>
                  <View style={styles.mention}>
                    <Text style={[styles.mentionText, font.bold]}>{bulletin.mention}</Text>
                  </View>
                  <Text style={[styles.rang, font.semibold]}>
                    {rangLabel(bulletin.rang, bulletin.eleve.effectif)}
                  </Text>
                </View>
              </View>
            </Card>
          </Enter>

          <Enter index={1}>
            <Card style={styles.table}>
              <SearchBar
                inset
                value={query}
                onChangeText={setQuery}
                placeholder="Matière, appréciation…"
                accessibilityLabel="Rechercher une matière"
              />
              <View style={styles.tableHead}>
                <Text style={[styles.colMatiere, styles.headText, font.bold]}>Matière</Text>
                <Text style={[styles.colNote, styles.headText, font.bold]}>Moy.</Text>
                <Text style={[styles.colCoef, styles.headText, font.bold]}>Coef.</Text>
              </View>
              {notes.map((note) => (
                <View key={note.matiere} style={styles.tableRow}>
                  <View style={styles.colMatiere}>
                    <Text style={[styles.matiere, font.semibold]}>{note.matiere}</Text>
                    <Text style={[styles.meta, font.regular]}>{note.appreciation}</Text>
                  </View>
                  <Text style={[styles.colNote, styles.note, font.bold, { color: noteColor(note.moyenne) }]}>
                    {note.moyenne.toFixed(1)}
                  </Text>
                  <Text style={[styles.colCoef, styles.meta, font.medium]}>{note.coefficient}</Text>
                </View>
              ))}
              {query.trim() && notes.length === 0 ? (
                <Text style={[styles.meta, font.regular]}>Aucune matière ne correspond.</Text>
              ) : null}
            </Card>
          </Enter>

          <Enter index={2}>
            <Card style={styles.apprec}>
              <Text style={[styles.kicker, font.medium]}>Conseil de classe</Text>
              <Text style={[styles.apprecText, font.regular]}>{bulletin.appreciationGenerale}</Text>
              <Text style={[styles.meta, font.regular]}>Publié le {bulletin.dateGeneration}</Text>
            </Card>
          </Enter>

          <Enter index={3}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Télécharger le bulletin en PDF"
              onPress={download}
              disabled={saving}
              style={({ pressed }) => [styles.download, pressStyle(pressed, reduceMotion), saving && { opacity: 0.6 }]}
            >
              <Ionicons name="download-outline" size={18} color={colors.white} />
              <Text style={[styles.downloadText, font.bold]}>
                {saving ? "Préparation du PDF…" : "Télécharger le PDF"}
              </Text>
            </Pressable>
          </Enter>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 4 },
  kicker: { fontSize: type.meta, color: colors.muted },
  heroName: { fontSize: type.heading, color: colors.text, letterSpacing: -0.3 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 },
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
  meta: { fontSize: type.meta, color: colors.muted, marginTop: 2 },
  table: { gap: 10, paddingVertical: 12 },
  tableHead: { flexDirection: "row", alignItems: "center", paddingBottom: 8, paddingHorizontal: 0 },
  headText: { fontSize: 12, color: colors.muted },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  colMatiere: { flex: 1, paddingEnd: 8 },
  colNote: { width: 52, textAlign: "right", fontVariant: ["tabular-nums"] },
  colCoef: { width: 44, textAlign: "right" },
  matiere: { fontSize: 15, color: colors.text },
  note: { fontSize: 16, fontVariant: ["tabular-nums"] },
  apprec: { gap: 8 },
  apprecText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  download: {
    minHeight: hit.min,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingHorizontal: 14,
  },
  downloadText: { color: colors.white, fontSize: 15 },
});
