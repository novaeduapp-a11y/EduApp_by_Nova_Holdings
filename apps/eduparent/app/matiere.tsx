import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { GradeBadge } from "@/components/GradeBadge";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchNotes } from "@/lib/api";
import { formatDate, formatNoteFr } from "@/lib/format";
import { colors, font, noteColor, noteSoft, radius, space, type } from "@/lib/theme";

function evalLabel(type: string) {
  if (type === "DEVOIR") return "Devoir";
  if (type === "COMPOSITION") return "Composition";
  if (type === "INTERROGATION") return "Interrogation";
  if (type === "TP") return "Travaux pratiques";
  return type;
}

function mentionOf(value: number | null) {
  if (value == null) return "Non calculée";
  if (value >= 16) return "Très bien";
  if (value >= 14) return "Bien";
  if (value >= 12) return "Assez bien";
  if (value >= 10) return "Passable";
  return "Insuffisant";
}

function scoreOn20(valeur: number, noteMax: number) {
  const max = noteMax || 20;
  return (valeur / max) * 20;
}

export default function MatiereScreen() {
  const { selected } = useSession();
  const params = useLocalSearchParams<{ matiere?: string; periode?: string }>();
  const matiere = String(params.matiere ?? "");
  const periodeParam = String(params.periode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchNotes>>["data"] | null>(null);

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchNotes(selected.id);
    setPayload(res.data);
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

  const notes = useMemo(() => {
    if (!payload || !matiere) return [];
    return payload.notes.filter(
      (n) => n.matiere === matiere && (!periodeParam || n.periode === periodeParam)
    );
  }, [payload, matiere, periodeParam]);

  const moyenne = useMemo(() => {
    if (!payload || !matiere) return null;
    return (
      payload.moyennesMatieres.find(
        (m) => m.matiere === matiere && (!periodeParam || m.periode === periodeParam)
      ) ?? null
    );
  }, [payload, matiere, periodeParam]);

  const avg = moyenne?.moyenne != null ? Number(moyenne.moyenne) : null;
  const ratio = avg == null ? 0 : Math.max(0, Math.min(1, avg / 20));

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PageTitle title="Matière" showBack />
        <EmptyState icon="person-outline" title="Aucun enfant sélectionné" body="Choisissez un enfant." />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle
        title={matiere || "Matière"}
        subtitle={[periodeParam, moyenne?.professeur, moyenne?.coefficient != null ? `coeff. ${moyenne.coefficient}` : null]
          .filter(Boolean)
          .join(" · ")}
        showBack
      />

      {loading && !payload ? <Skeleton count={2} /> : null}
      {error ? <LoadError message={error} onRetry={() => load()} /> : null}

      <Enter>
        <Card style={styles.hero}>
          <Text style={[styles.kicker, font.medium]}>Moyenne matière</Text>
          <Text style={[styles.avg, font.bold, { color: noteColor(avg) }]}>
            {avg != null ? `${formatNoteFr(avg, 2)} / 20` : "—"}
          </Text>
          <Text style={[styles.mention, font.semibold, { color: noteColor(avg) }]}>{mentionOf(avg)}</Text>
          <View style={[styles.track, { backgroundColor: noteSoft(avg) }]}>
            <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: noteColor(avg) }]} />
          </View>
        </Card>
      </Enter>

      <Enter index={1}>
        <Text style={[styles.section, font.bold]}>
          Devoirs et évaluations · {notes.length}
        </Text>
        {notes.length === 0 ? (
          <EmptyState
            icon="school-outline"
            title="Aucune note"
            body={`Les devoirs et compositions de ${matiere} apparaîtront ici.`}
          />
        ) : (
          <Card style={styles.list}>
            {notes.map((note, i) => {
              const value = note.valeur == null ? null : Number(note.valeur);
              const max = Number(note.noteMax) || 20;
              const sur20 = value == null ? null : scoreOn20(value, max);
              const label =
                value == null
                  ? "Abs"
                  : formatNoteFr(sur20!, max === 20 && Number.isInteger(value) ? 0 : 1);
              return (
                <View key={note.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <View style={styles.copy}>
                    <Text style={[styles.eval, font.semibold]} numberOfLines={2}>
                      {note.evaluation}
                    </Text>
                    <Text style={[styles.meta, font.regular]}>
                      {evalLabel(note.type)}
                      {note.date ? ` · ${formatDate(note.date)}` : ""}
                      {value != null && max !== 20 ? ` · ${value}/${max}` : ""}
                    </Text>
                  </View>
                  <GradeBadge
                    value={sur20}
                    label={label}
                    accessibilityLabel={value == null ? "Absent" : `${sur20 != null ? formatNoteFr(sur20) : ""} sur 20`}
                  />
                </View>
              );
            })}
          </Card>
        )}
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 8 },
  kicker: { fontSize: type.meta, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  avg: { fontSize: 32, fontVariant: ["tabular-nums"] },
  mention: { fontSize: 15 },
  track: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: 4 },
  fill: { height: 8, borderRadius: 4 },
  section: { fontSize: 16, color: colors.text, marginBottom: 4 },
  list: { gap: 0, paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: space.group, paddingVertical: 12 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  copy: { flex: 1, gap: 2 },
  eval: { fontSize: 15, color: colors.text },
  meta: { fontSize: type.meta, color: colors.muted },
});
