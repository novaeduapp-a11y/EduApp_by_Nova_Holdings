import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/Skeleton";
import { confirmConvocation, fetchConvocation } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

type Detail = Awaited<ReturnType<typeof fetchConvocation>>["data"];

export default function ConvocationScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { id, notificationId } = useLocalSearchParams<{ id?: string; notificationId?: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError("Convocation introuvable.");
      setLoading(false);
      return;
    }
    setError(null);
    const res = await fetchConvocation(id);
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

  const confirm = async () => {
    if (!id || !data || data.statut === "CONFIRMEE") return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await confirmConvocation(id);
      setData({
        ...data,
        statut: res.data.statut,
        confirmedAt: res.data.confirmedAt,
      });
    } catch (err) {
      setActionError(
        err instanceof Error && err.message.trim()
          ? err.message
          : "Impossible de confirmer. Vérifiez votre connexion."
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmed = data?.statut === "CONFIRMEE";
  const when = data
    ? `${formatDate(data.dateConvocation)}${
        formatTime(data.dateConvocation) ? ` · ${formatTime(data.dateConvocation)}` : ""
      }`
    : "";

  return (
    <Screen>
      <PageTitle title="Convocation" subtitle="Document officiel de l’établissement" showBack />

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
          <Text style={[styles.kicker, font.semibold]}>CONVOCATION</Text>
          <Text style={[styles.motif, font.bold]}>Convocation à l’établissement</Text>

          <View style={styles.metaBlock}>
            <MetaRow label="Élève" value={`${data.eleveNom} (${data.classeNom})`} />
            <MetaRow label="Date du rendez-vous" value={when} />
            <MetaRow label="Demandé par" value={data.demandePar} />
          </View>

          <View style={styles.messageBlock}>
            <Text style={[styles.messageLabel, font.semibold]}>Motif</Text>
            <Text style={[styles.messageBody, font.regular]}>{data.motif}</Text>
          </View>

          {data.message?.trim() ? (
            <View style={styles.messageBlock}>
              <Text style={[styles.messageLabel, font.semibold]}>Message</Text>
              <Text style={[styles.messageBody, font.regular]}>{data.message.trim()}</Text>
            </View>
          ) : null}

          {actionError ? <Text style={[styles.actionError, font.medium]}>{actionError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={confirmed ? "Présence déjà confirmée" : "Confirmer ma présence"}
            disabled={busy || confirmed}
            onPress={confirm}
            style={({ pressed }) => [
              styles.cta,
              confirmed && styles.ctaDone,
              pressStyle(pressed && !confirmed && !busy, reduceMotion),
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.ctaText, font.bold]}>
                {confirmed ? "Présence confirmée" : "Confirmer ma présence"}
              </Text>
            )}
          </Pressable>

          {confirmed && data.confirmedAt ? (
            <Text style={[styles.confirmedHint, font.regular]}>
              Confirmée le {formatDate(data.confirmedAt)}
              {formatTime(data.confirmedAt) ? ` à ${formatTime(data.confirmedAt)}` : ""}
            </Text>
          ) : null}

          {notificationId ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour aux notifications"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.secondary, pressStyle(pressed, reduceMotion)]}
            >
              <Text style={[styles.secondaryText, font.semibold]}>Retour</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, font.medium]}>{label}</Text>
      <Text style={[styles.metaValue, font.semibold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 20,
    gap: 16,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.fail,
  },
  motif: {
    fontSize: type.title - 4,
    color: colors.text,
    lineHeight: 32,
  },
  metaBlock: { gap: 10 },
  metaRow: { gap: 2 },
  metaLabel: { fontSize: 13, color: colors.muted },
  metaValue: { fontSize: 16, color: colors.text },
  messageBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 14,
    gap: 6,
  },
  messageLabel: { fontSize: 13, color: colors.muted },
  messageBody: { fontSize: 16, color: colors.text, lineHeight: 24 },
  cta: {
    minHeight: hit.min + 8,
    borderRadius: 16,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  ctaDone: { backgroundColor: colors.good },
  ctaText: { fontSize: 16, color: colors.white },
  confirmedHint: { fontSize: 13, color: colors.muted, textAlign: "center" },
  actionError: { fontSize: 14, color: colors.fail },
  secondary: {
    minHeight: hit.min,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 15, color: colors.primary },
});
