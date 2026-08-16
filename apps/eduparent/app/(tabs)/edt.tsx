import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useSession } from "@/context/session";
import { fetchEmploiDuTemps } from "@/lib/api";
import { weekdayKey } from "@/lib/format";
import { colors } from "@/lib/theme";

type Semaine = Awaited<ReturnType<typeof fetchEmploiDuTemps>>["data"]["semaine"];

export default function EdtScreen() {
  const { selected } = useSession();
  const [loading, setLoading] = useState(false);
  const [semaine, setSemaine] = useState<Semaine>([]);
  const [jour, setJour] = useState<Semaine[number]["jour"]>(weekdayKey() ?? "LUNDI");

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetchEmploiDuTemps(selected.id)
      .then((res) => {
        setSemaine(res.data.semaine);
        const today = weekdayKey();
        if (today && res.data.semaine.some((d) => d.jour === today)) setJour(today);
      })
      .catch(() => setSemaine([]))
      .finally(() => setLoading(false));
  }, [selected?.id]);

  const selectedDay = semaine.find((d) => d.jour === jour);

  if (!selected) {
    return (
      <View style={styles.empty}>
        <ScreenHeader title="Emploi du temps" />
        <Text style={styles.muted}>Sélectionnez un enfant sur l&apos;accueil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title={`EDT · ${selected.prenom}`} />
      <Text style={styles.muted}>{selected.classe} · Lundi à vendredi</Text>

      <View style={styles.days}>
        {semaine.map((day) => {
          const active = day.jour === jour;
          return (
            <Pressable
              key={day.jour}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setJour(day.jour)}
              style={({ pressed }) => [styles.day, active && styles.dayActive, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.label.slice(0, 3)}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      {(selectedDay?.cours ?? []).map((cours) => (
        <View key={`${cours.matiere}-${cours.horaire}`} style={styles.slot}>
          <Text style={styles.horaire}>{cours.horaire}</Text>
          <Text style={styles.matiere}>{cours.matiere}</Text>
          <Text style={styles.muted}>
            {[cours.professeur, cours.salle].filter(Boolean).join(" · ") || " "}
          </Text>
        </View>
      ))}

      {!loading && (selectedDay?.cours.length ?? 0) === 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Aucun cours ce jour</Text>
          <Text style={styles.muted}>
            L&apos;emploi du temps apparaîtra ici dès que le préfet aura saisi les créneaux (V1.1).
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
  days: { flexDirection: "row", gap: 8 },
  day: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontWeight: "600", color: colors.text, fontSize: 13 },
  dayTextActive: { color: colors.white },
  slot: { backgroundColor: colors.white, borderRadius: 14, padding: 14, gap: 4 },
  horaire: { fontSize: 13, fontWeight: "600", color: colors.primary },
  matiere: { fontSize: 16, fontWeight: "700", color: colors.text },
  panel: { backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 8 },
  panelTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});
