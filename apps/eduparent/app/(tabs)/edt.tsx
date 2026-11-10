import { Fragment, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PortalHeader } from "@/components/PortalHeader";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchEmploiDuTemps } from "@/lib/api";
import { weekdayKey } from "@/lib/format";
import { colors, font, hit, pressStyle, radius, subjectColor, type, useReduceMotion } from "@/lib/theme";

type Semaine = Awaited<ReturnType<typeof fetchEmploiDuTemps>>["data"]["semaine"];
type Jour = Semaine[number]["jour"];
type Cours = Semaine[number]["cours"][number];
type View_ = "jour" | "semaine";

const ORDER = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"] as const satisfies readonly Jour[];
type JourOuvre = (typeof ORDER)[number];
const SHORT: Record<JourOuvre, string> = { LUNDI: "Lun", MARDI: "Mar", MERCREDI: "Mer", JEUDI: "Jeu", VENDREDI: "Ven" };
const HOUR_HEIGHT = 58;
const TIME_COL = 36;

function asJourOuvre(value: string | null | undefined): JourOuvre | null {
  return value && (ORDER as readonly string[]).includes(value) ? (value as JourOuvre) : null;
}

function toMinutes(value: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function range(cours: Cours): [number, number] | null {
  const [a, b] = cours.horaire.split(/[–-]/).map((part) => toMinutes(part));
  return a == null || b == null ? null : [a, b];
}

function hhmm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

function weekDates(): Record<JourOuvre, Date> {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  const offset = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  monday.setDate(today.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return Object.fromEntries(
    ORDER.map((jour, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return [jour, d];
    })
  ) as Record<JourOuvre, Date>;
}

function sorted(cours: Cours[]) {
  return [...cours].sort((a, b) => (range(a)?.[0] ?? 0) - (range(b)?.[0] ?? 0));
}

export default function EdtScreen() {
  const { selected } = useSession();
  const reduceMotion = useReduceMotion();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semaine, setSemaine] = useState<Semaine>([]);
  const [view, setView] = useState<View_>("jour");
  // weekend → pas de créneau scolaire ; rester sur un jour ouvré (sinon DayView crash .map).
  const today = asJourOuvre(weekdayKey());
  const [jour, setJour] = useState<JourOuvre>(today ?? "LUNDI");
  const dates = useMemo(weekDates, []);

  const load = useCallback(async () => {
    if (!selected) return;
    setError(null);
    const res = await fetchEmploiDuTemps(selected.id);
    setSemaine(res.data.semaine);
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

  const byDay = useMemo(() => {
    const map = {} as Record<JourOuvre, Cours[]>;
    for (const j of ORDER) map[j] = sorted(semaine.find((d) => d.jour === j)?.cours ?? []);
    return map;
  }, [semaine]);

  const totalWeek = ORDER.reduce((sum, j) => sum + byDay[j].length, 0);

  if (!selected) {
    return (
      <Screen scroll={false}>
        <PortalHeader />
        <EmptyState
          icon="person-outline"
          title="Aucun enfant sélectionné"
          body="Choisissez un enfant ci-dessus pour voir l’emploi du temps."
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
      <PortalHeader />

      <Text style={[styles.weekLabel, font.bold]}>SEMAINE EN COURS</Text>

      <View style={styles.segment} accessibilityRole="tablist">
        {(["jour", "semaine"] as const).map((key) => {
          const on = view === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setView(key)}
              style={[styles.segmentItem, on && styles.segmentOn]}
            >
              <Ionicons
                name={key === "jour" ? (on ? "list" : "list-outline") : on ? "grid" : "grid-outline"}
                size={16}
                color={on ? colors.primary : colors.muted}
              />
              <Text style={[styles.segmentText, on ? font.bold : font.medium, on && { color: colors.primary }]}>
                {key === "jour" ? "Jour" : "Semaine"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && semaine.length === 0 ? <Skeleton count={3} /> : null}
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

      {!loading && !error && semaine.length > 0 && totalWeek === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Emploi du temps vide"
          body="Il apparaîtra ici dès que l’établissement aura saisi les créneaux de la classe."
        />
      ) : null}

      {totalWeek > 0 && view === "jour" ? (
        <DayView
          jour={jour}
          setJour={setJour}
          today={today}
          dates={dates}
          byDay={byDay}
          reduceMotion={reduceMotion}
        />
      ) : null}

      {totalWeek > 0 && view === "semaine" ? (
        <WeekView
          today={today}
          dates={dates}
          byDay={byDay}
          onOpen={(j) => {
            setJour(j);
            setView("jour");
          }}
        />
      ) : null}
    </Screen>
  );
}

function DayView({
  jour,
  setJour,
  today,
  dates,
  byDay,
  reduceMotion,
}: {
  jour: JourOuvre;
  setJour: (j: JourOuvre) => void;
  today: JourOuvre | null;
  dates: Record<JourOuvre, Date>;
  byDay: Record<JourOuvre, Cours[]>;
  reduceMotion: boolean;
}) {
  const cours = byDay[jour] ?? [];
  const isToday = jour === today;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const ranges = cours.map(range);
  const first = ranges.find(Boolean)?.[0];
  const last = [...ranges].reverse().find(Boolean)?.[1];
  const nextIndex = isToday ? ranges.findIndex((r) => r != null && r[0] > nowMin) : -1;
  const currentIndex = isToday ? ranges.findIndex((r) => r != null && nowMin >= r[0] && nowMin < r[1]) : -1;
  const dateLabel = dates[jour].toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  let headline = `${cours.length} cours`;
  if (first != null && last != null) headline += ` · ${hhmm(first)} – ${hhmm(last)}`;

  let status: string | null = null;
  if (isToday && currentIndex >= 0) status = `En cours : ${cours[currentIndex].matiere}`;
  else if (isToday && nextIndex >= 0) status = `Prochain : ${cours[nextIndex].matiere} dans ${duration(ranges[nextIndex]![0] - nowMin)}`;
  else if (isToday && cours.length > 0) status = "Journée terminée";

  return (
    <>
      <View style={styles.strip}>
        {ORDER.map((j) => {
          const on = j === jour;
          const count = (byDay[j] ?? []).length;
          return (
            <Pressable
              key={j}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${dates[j].toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" })}, ${count} cours`}
              onPress={() => setJour(j)}
              style={({ pressed }) => [styles.day, on && styles.dayOn, pressStyle(pressed, reduceMotion)]}
            >
              <Text style={[styles.dayName, font.bold, on && styles.dayTextOn]}>{SHORT[j]}</Text>
              <Text style={[styles.dayCount, font.medium, on && styles.dayTextOn]}>
                {count} cours
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Enter>
        <Card style={styles.summary}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryDate, font.bold]}>
                {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
              </Text>
              <Text style={[styles.summaryMeta, font.regular]}>{cours.length ? headline : "Aucun cours"}</Text>
            </View>
            {isToday ? <Text style={[styles.todayPill, font.bold]}>Aujourd’hui</Text> : null}
          </View>
          {status ? (
            <View style={styles.statusRow}>
              <Ionicons
                name={currentIndex >= 0 ? "radio-button-on" : nextIndex >= 0 ? "alarm-outline" : "checkmark-done-outline"}
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.statusText, font.semibold]} numberOfLines={1}>
                {status}
              </Text>
            </View>
          ) : null}
        </Card>
      </Enter>

      {cours.length === 0 ? (
        <EmptyState icon="sunny-outline" title="Pas de cours" body="Aucun créneau n’est prévu ce jour-là." />
      ) : (
        <Enter index={1}>
          <View style={styles.agenda}>
            {cours.map((item, i) => {
              const r = ranges[i];
              const prev = i > 0 ? ranges[i - 1] : null;
              const gap = r && prev ? r[0] - prev[1] : 0;
              const tone = subjectColor(item.matiere);
              const current = i === currentIndex;
              const past = isToday && r != null && nowMin >= r[1];
              return (
                <Fragment key={`${item.horaire}-${i}`}>
                  {gap >= 15 ? (
                    <View style={styles.pause}>
                      <View style={styles.pauseLine} />
                      <Text style={[styles.pauseText, font.medium]}>
                        {gap >= 60 ? "Pause déjeuner" : "Pause"} · {duration(gap)}
                      </Text>
                      <View style={styles.pauseLine} />
                    </View>
                  ) : null}
                  <View style={[styles.slot, past && styles.slotPast]}>
                    <View
                      style={[
                        styles.slotCard,
                        current && styles.slotCardNow,
                        current && { borderColor: tone.fg },
                      ]}
                    >
                      <View style={styles.slotTimeBlock}>
                        <Text style={[styles.horaireLabel, font.medium]}>Horaire</Text>
                        <Text style={[styles.slotStart, font.bold]}>
                          {r ? `${hhmm(r[0]).replace(":", "h")}–${hhmm(r[1]).replace(":", "h")}` : item.horaire}
                        </Text>
                      </View>
                      <View style={styles.slotBody}>
                        <View style={styles.slotHead}>
                          <Text style={[styles.slotMatiere, font.bold]} numberOfLines={1}>
                            {item.matiere}
                          </Text>
                          {current ? (
                            <Text style={[styles.nowPill, font.bold]}>En cours</Text>
                          ) : null}
                        </View>
                        <Text style={[styles.slotMetaText, font.regular]} numberOfLines={1}>
                          {[item.professeur, item.salle ? `Salle ${item.salle}` : null].filter(Boolean).join(" · ") ||
                            "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Fragment>
              );
            })}
          </View>
        </Enter>
      )}
    </>
  );
}

function WeekView({
  today,
  dates,
  byDay,
  onOpen,
}: {
  today: JourOuvre | null;
  dates: Record<JourOuvre, Date>;
  byDay: Record<JourOuvre, Cours[]>;
  onOpen: (j: JourOuvre) => void;
}) {
  const [width, setWidth] = useState(0);
  const all = ORDER.flatMap((j) => (byDay[j] ?? []).map(range).filter((r): r is [number, number] => r != null));
  const startHour = all.length ? Math.floor(Math.min(...all.map((r) => r[0])) / 60) : 8;
  const endHour = all.length ? Math.ceil(Math.max(...all.map((r) => r[1])) / 60) : 17;
  const hours = Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i);
  const height = hours.length * HOUR_HEIGHT;
  const colWidth = width > 0 ? (width - TIME_COL) / ORDER.length : 0;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = today != null && nowMin >= startHour * 60 && nowMin <= endHour * 60;

  return (
    <Enter>
      <Card style={styles.gridCard}>
        <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
          <View style={styles.gridHead}>
            <View style={{ width: TIME_COL }} />
            {ORDER.map((j) => {
              const on = j === today;
              return (
                <Pressable
                  key={j}
                  accessibilityRole="button"
                  accessibilityLabel={`Voir ${dates[j].toLocaleDateString("fr-FR", { weekday: "long" })}`}
                  onPress={() => onOpen(j)}
                  style={[styles.gridDay, { width: colWidth }]}
                >
                  <Text style={[styles.gridDayName, font.medium, on && { color: colors.primary }]}>{SHORT[j]}</Text>
                  <View style={[styles.gridDayNum, on && styles.gridDayNumOn]}>
                    <Text style={[styles.gridDayNumText, font.bold, on && { color: colors.white }]}>
                      {dates[j].getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height, flexDirection: "row" }}>
            <View style={{ width: TIME_COL }}>
              {hours.map((h) => (
                <Text key={h} style={[styles.hourLabel, font.medium, { top: (h - startHour) * HOUR_HEIGHT - 7 }]}>
                  {h}h
                </Text>
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {hours.map((h) => (
                <View key={h} style={[styles.hourLine, { top: (h - startHour) * HOUR_HEIGHT }]} />
              ))}
              {ORDER.map((j, col) => (
                <View
                  key={j}
                  style={[
                    styles.col,
                    { left: col * colWidth, width: colWidth, height },
                    j === today && styles.colToday,
                  ]}
                >
                  {(byDay[j] ?? []).map((item, i) => {
                    const r = range(item);
                    if (!r) return null;
                    const top = ((r[0] - startHour * 60) / 60) * HOUR_HEIGHT;
                    const h = Math.max(22, ((r[1] - r[0]) / 60) * HOUR_HEIGHT - 3);
                    const tone = subjectColor(item.matiere);
                    return (
                      <Pressable
                        key={`${item.horaire}-${i}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${dates[j].toLocaleDateString("fr-FR", { weekday: "long" })}, ${item.horaire}, ${item.matiere}${item.salle ? `, salle ${item.salle}` : ""}`}
                        onPress={() => onOpen(j)}
                        style={[styles.block, { top, height: h, backgroundColor: tone.bg, borderStartColor: tone.fg }]}
                      >
                        <Text style={[styles.blockTitle, font.bold, { color: tone.fg }]} numberOfLines={h > 44 ? 2 : 1}>
                          {item.matiere}
                        </Text>
                        {item.salle && h > 40 ? (
                          <Text style={[styles.blockMeta, font.medium]} numberOfLines={1}>
                            {item.salle}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              {showNow && today ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.nowLine,
                    {
                      top: ((nowMin - startHour * 60) / 60) * HOUR_HEIGHT,
                      left: ORDER.indexOf(today) * colWidth,
                      width: colWidth,
                    },
                  ]}
                >
                  <View style={styles.nowDot} />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
      <Text style={[styles.hint, font.regular]}>Touchez un jour ou un cours pour voir le détail.</Text>
    </Enter>
  );
}

const styles = StyleSheet.create({
  weekLabel: {
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1,
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderRadius: radius.control,
    backgroundColor: colors.white,
  },
  segmentItem: {
    flex: 1,
    minHeight: hit.min - 4,
    borderRadius: radius.control - 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  segmentOn: { backgroundColor: colors.tint },
  segmentText: { fontSize: 14, color: colors.muted },

  strip: { flexDirection: "row", gap: 6 },
  day: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 8,
  },
  dayOn: { backgroundColor: colors.primary },
  dayName: { fontSize: 14, color: colors.text },
  dayCount: { fontSize: 11, color: colors.muted },
  dayTextOn: { color: colors.white },

  summary: { gap: 10 },
  summaryTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  summaryDate: { fontSize: 18, color: colors.text },
  summaryMeta: { fontSize: 14, color: colors.muted, marginTop: 2, fontVariant: ["tabular-nums"] },
  todayPill: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: colors.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: colors.tint,
  },
  statusText: { flex: 1, fontSize: 14, color: colors.primary },

  agenda: { gap: 10 },
  pause: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  pauseLine: { flex: 1, height: 1, backgroundColor: colors.border },
  pauseText: { fontSize: 12, color: colors.muted },
  slot: { flexDirection: "row" },
  slotPast: { opacity: 0.55 },
  slotCard: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
    borderRadius: 18,
    borderStartWidth: 4,
    borderStartColor: colors.primary,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  slotCardNow: { borderWidth: 1.5, borderStartWidth: 4 },
  slotTimeBlock: { width: 92, gap: 2 },
  horaireLabel: {
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  slotStart: { fontSize: 15, color: colors.text, fontVariant: ["tabular-nums"] },
  slotBody: { flex: 1, gap: 4, justifyContent: "center" },
  slotHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  slotMatiere: { flex: 1, fontSize: 18, color: colors.text },
  nowPill: {
    fontSize: 11,
    color: colors.white,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  slotMetaText: { fontSize: 13, color: colors.muted },

  gridCard: { paddingHorizontal: 10, paddingTop: 12, paddingBottom: 14 },
  gridHead: { flexDirection: "row", marginBottom: 10 },
  gridDay: { alignItems: "center", gap: 4 },
  gridDayName: { fontSize: 11, color: colors.muted },
  gridDayNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  gridDayNumOn: { backgroundColor: colors.primary },
  gridDayNumText: { fontSize: 14, color: colors.text, fontVariant: ["tabular-nums"] },
  hourLabel: { position: "absolute", left: 0, fontSize: 10, color: colors.muted, fontVariant: ["tabular-nums"] },
  hourLine: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  col: { position: "absolute", top: 0, paddingHorizontal: 2 },
  colToday: { backgroundColor: "rgba(26,95,212,0.04)", borderRadius: 8 },
  block: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 8,
    borderStartWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 3,
    overflow: "hidden",
  },
  blockTitle: { fontSize: 10.5, lineHeight: 13 },
  blockMeta: { fontSize: 9.5, color: colors.muted, marginTop: 1 },
  nowLine: { position: "absolute", height: 2, backgroundColor: colors.fail, borderRadius: 1 },
  nowDot: { position: "absolute", left: -3, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fail },
  hint: { fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 10 },
});
