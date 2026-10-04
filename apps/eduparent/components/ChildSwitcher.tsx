import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { ChildFilterSheet } from "@/components/ChildFilterSheet";
import { SearchBar } from "@/components/SearchBar";
import { useSession } from "@/context/session";
import { matchesQuery, uniqueValues } from "@/lib/filter";
import { colors, font, hit, pressStyle, radius, useReduceMotion } from "@/lib/theme";

export function ChildSwitcher({ light = false }: { light?: boolean }) {
  const { enfants, selected, selectChild } = useSession();
  const reduceMotion = useReduceMotion();
  const [query, setQuery] = useState("");
  const [classe, setClasse] = useState("");
  const [cycle, setCycle] = useState("");
  const [open, setOpen] = useState(false);

  const classes = useMemo(() => uniqueValues(enfants.map((enfant) => enfant.classe)), [enfants]);
  const cycles = useMemo(() => uniqueValues(enfants.map((enfant) => enfant.cycle)), [enfants]);
  const canFilter = cycles.length > 1 || classes.length > 1;
  const filterActive = Boolean(cycle || classe);
  const showSearch = enfants.length > 2;

  const visible = useMemo(() => {
    return enfants.filter((enfant) => {
      if (classe && enfant.classe !== classe) return false;
      if (cycle && enfant.cycle !== cycle) return false;
      return matchesQuery(query, enfant.prenom, enfant.nom, enfant.classe, enfant.matricule, enfant.cycle);
    });
  }, [enfants, query, classe, cycle]);

  if (enfants.length === 0) return null;

  if (!light && enfants.length === 1) {
    return (
      <Text style={[styles.solo, font.regular]}>
        {selected ? `${selected.prenom} · ${selected.classe}` : ""}
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      {showSearch ? (
        <SearchBar
          light={light}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un enfant…"
          accessibilityLabel="Rechercher un enfant"
          onFilterPress={canFilter ? () => setOpen(true) : undefined}
          filterActive={filterActive}
        />
      ) : canFilter ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filterActive ? "Modifier le filtre" : "Filtrer"}
          accessibilityState={{ selected: filterActive }}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.filterBtn,
            light && styles.filterBtnLight,
            filterActive && (light ? styles.filterBtnOnLight : styles.filterBtnOn),
            pressStyle(pressed, reduceMotion),
          ]}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={filterActive ? (light ? colors.primary : colors.white) : light ? "rgba(255,255,255,0.9)" : colors.text}
          />
          <Text
            style={[
              styles.filterBtnText,
              font.semibold,
              light && styles.filterBtnTextLight,
              filterActive && (light ? styles.filterBtnTextOnLight : styles.filterBtnTextOn),
            ]}
          >
            Filtrer
          </Text>
        </Pressable>
      ) : null}

      {filterActive ? (
        <View style={styles.summary}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Modifier le filtre"
            onPress={() => setOpen(true)}
            style={styles.summaryHit}
          >
            <Text style={[styles.summaryText, font.medium, light && styles.summaryLight]} numberOfLines={1}>
              {[cycle, classe].filter(Boolean).join(" · ")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Effacer les filtres"
            onPress={() => {
              setCycle("");
              setClasse("");
            }}
            hitSlop={8}
            style={styles.summaryHit}
          >
            <Ionicons name="close-circle" size={18} color={light ? "rgba(255,255,255,0.78)" : colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, light && styles.rowLight]}
        style={light ? styles.rowWrap : undefined}
      >
        {visible.map((enfant) => {
          const active = enfant.id === selected?.id;
          return (
            <Pressable
              key={enfant.id}
              accessibilityRole="button"
              accessibilityLabel={`${enfant.prenom}, ${enfant.classe}`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active) return;
                if (!reduceMotion) Haptics.selectionAsync();
                selectChild(enfant.id);
              }}
              style={({ pressed }) => [
                styles.chip,
                light && styles.chipLight,
                active && (light ? styles.chipOnLight : styles.chipOn),
                pressStyle(pressed, reduceMotion),
              ]}
            >
              <View style={[styles.avatar, light && styles.avatarLight, active && styles.avatarOn]}>
                <Text style={[styles.initial, font.bold, light && styles.initialLight, active && styles.initialOn]}>
                  {enfant.prenom.slice(0, 1)}
                </Text>
              </View>
              {active ? (
                <View style={styles.copy}>
                  <Text
                    style={[styles.name, font.semibold, light && styles.nameOnLight]}
                    numberOfLines={1}
                  >
                    {enfant.prenom}
                  </Text>
                  <Text style={[styles.meta, font.medium]} numberOfLines={1}>
                    {enfant.classe}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
        {visible.length === 0 ? (
          <Text style={[styles.empty, font.regular, light && styles.summaryLight]}>Aucun enfant ne correspond</Text>
        ) : null}
      </ScrollView>

      <ChildFilterSheet
        visible={open}
        onClose={() => setOpen(false)}
        cycles={cycles}
        cycle={cycle}
        onCycle={setCycle}
        classes={classes}
        classe={classe}
        onClasse={setClasse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  solo: { fontSize: 16, color: colors.muted, lineHeight: 22 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    minHeight: 28,
  },
  summaryHit: { minHeight: 28, justifyContent: "center" },
  summaryText: { fontSize: 13, color: colors.muted },
  summaryLight: { color: "rgba(255,255,255,0.82)" },
  filterBtn: {
    minHeight: hit.min,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  filterBtnLight: { backgroundColor: "rgba(255,255,255,0.16)" },
  filterBtnOn: { backgroundColor: colors.primary },
  filterBtnOnLight: { backgroundColor: colors.white },
  filterBtnText: { fontSize: 14, color: colors.text },
  filterBtnTextLight: { color: "rgba(255,255,255,0.92)" },
  filterBtnTextOn: { color: colors.white },
  filterBtnTextOnLight: { color: colors.text },
  rowWrap: { marginHorizontal: -20 },
  row: { gap: 8, paddingEnd: 24, alignItems: "center" },
  rowLight: { paddingHorizontal: 20, paddingEnd: 28 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: hit.min,
    padding: 4,
    paddingRight: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  chipLight: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingRight: 4,
  },
  chipOn: { backgroundColor: colors.tint, paddingRight: 12 },
  chipOnLight: { backgroundColor: colors.white, paddingRight: 14 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLight: { backgroundColor: "rgba(255,255,255,0.22)" },
  avatarOn: { backgroundColor: colors.primary },
  initial: { fontSize: 14, color: colors.primary },
  initialLight: { color: colors.white },
  initialOn: { color: colors.white },
  copy: { paddingRight: 2 },
  name: { fontSize: 14, color: colors.text },
  nameOnLight: { color: colors.text },
  meta: { fontSize: 11, color: colors.muted },
  empty: { fontSize: 14, color: colors.muted, paddingVertical: 10 },
});
