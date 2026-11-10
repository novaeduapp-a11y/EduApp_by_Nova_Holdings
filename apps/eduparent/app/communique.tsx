import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { accuseCommunique, fetchCommunique } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

type Detail = Awaited<ReturnType<typeof fetchCommunique>>["data"];

export default function CommuniqueScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError("Communiqué introuvable.");
      setLoading(false);
      return;
    }
    setError(null);
    const res = await fetchCommunique(id);
    setData(res.data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err)))
        .finally(() => setLoading(false));
    }, [load])
  );

  const accuse = async () => {
    if (!id || !data || data.ackedAt) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await accuseCommunique(id);
      setData({ ...data, ackedAt: res.data.ackedAt });
    } catch (err) {
      setActionError(
        err instanceof Error && err.message.trim()
          ? err.message
          : "Impossible d’accuser réception. Vérifiez votre connexion."
      );
    } finally {
      setBusy(false);
    }
  };

  const acked = Boolean(data?.ackedAt);

  return (
    <Screen>
      <PageTitle
        title={data?.urgent ? "Communiqué urgent" : "Communiqué"}
        subtitle="Document officiel de l’établissement"
        showBack
      />

      {loading && !data && !error ? <Skeleton count={3} /> : null}
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

      {data ? (
        <View style={styles.sheet}>
          {data.urgent ? (
            <Text style={[styles.urgent, font.semibold]}>URGENT</Text>
          ) : (
            <Text style={[styles.kicker, font.semibold]}>COMMUNIQUÉ</Text>
          )}
          <Text style={[styles.titre, font.bold]}>{data.titre}</Text>
          <Text style={[styles.meta, font.medium]}>
            {data.auteur} · {formatDate(data.createdAt)}
            {formatTime(data.createdAt) ? ` · ${formatTime(data.createdAt)}` : ""}
          </Text>
          <Text style={[styles.corps, font.regular]}>{data.corps}</Text>

          {actionError ? <Text style={[styles.actionError, font.medium]}>{actionError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={acked ? "Réception déjà accusée" : "Accuser réception"}
            disabled={busy || acked}
            onPress={accuse}
            style={({ pressed }) => [
              styles.cta,
              acked && styles.ctaDone,
              pressStyle(pressed && !acked && !busy, reduceMotion),
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.ctaText, font.bold]}>
                {acked ? "Réception accusée" : "Accuser réception"}
              </Text>
            )}
          </Pressable>

          {acked && data.ackedAt ? (
            <Text style={[styles.ackedHint, font.regular]}>
              Accusé le {formatDate(data.ackedAt)}
              {formatTime(data.ackedAt) ? ` à ${formatTime(data.ackedAt)}` : ""}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.secondary, pressStyle(pressed, reduceMotion)]}
          >
            <Text style={[styles.secondaryText, font.semibold]}>Retour</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 20,
    gap: 14,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#B45309",
  },
  urgent: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.fail,
  },
  titre: {
    fontSize: type.title - 4,
    color: colors.text,
    lineHeight: 32,
  },
  meta: { fontSize: 14, color: colors.muted },
  corps: { fontSize: 16, color: colors.text, lineHeight: 24 },
  cta: {
    minHeight: hit.min + 8,
    borderRadius: 16,
    backgroundColor: "#B45309",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  ctaDone: { backgroundColor: colors.good },
  ctaText: { fontSize: 16, color: colors.white },
  ackedHint: { fontSize: 13, color: colors.muted, textAlign: "center" },
  actionError: { fontSize: 14, color: colors.fail },
  secondary: {
    minHeight: hit.min,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 15, color: colors.primary },
});
