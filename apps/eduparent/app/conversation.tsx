import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchConversation, replyToFil, startConversation } from "@/lib/api";
import { dayLabel, formatTime, initials } from "@/lib/format";
import { colors, font, hit, pressStyle, radius, shadow, subjectColor, type, useReduceMotion } from "@/lib/theme";

type Message = Awaited<ReturnType<typeof fetchConversation>>["data"]["messages"][number];

const SUGGESTIONS = [
  "Bonjour, je souhaiterais vous rencontrer.",
  "Bonjour, mon enfant sera absent.",
  "Bonjour, j’ai une question sur les devoirs.",
];

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ConversationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { selected, user } = useSession();
  const params = useLocalSearchParams<{
    filId?: string;
    professeurId?: string;
    name?: string;
    matiere?: string;
    eleveId?: string;
  }>();
  const eleveId = params.eleveId || selected?.id;
  const [filId, setFilId] = useState(params.filId && params.filId !== "new" ? params.filId : null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matiere, setMatiere] = useState(params.matiere || "");
  const [corps, setCorps] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const name = params.name ?? "Conversation";
  const tone = subjectColor(matiere || name);

  const load = async (id: string) => {
    if (!eleveId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchConversation(eleveId, id);
      setMessages(res.data.messages);
      if (res.data.matiere) setMatiere(res.data.matiere);
    } catch (err) {
      setError(loadErrorMessage(err, "Impossible de charger la conversation. Vérifiez votre connexion et réessayez."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filId && eleveId) load(filId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filId, eleveId]);

  const send = async () => {
    const text = corps.trim();
    if (!eleveId || !text) return;
    setBusy(true);
    setSendError(null);
    try {
      if (filId) {
        await replyToFil(eleveId, filId, text);
        setCorps("");
        await load(filId);
      } else if (params.professeurId) {
        const created = await startConversation(eleveId, params.professeurId, text);
        setCorps("");
        setFilId(created.data.filId);
      }
    } catch (err) {
      setSendError(
        err instanceof Error && err.message.trim() ? err.message : "Impossible d’envoyer. Vérifiez votre connexion et réessayez."
      );
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const canSend = corps.trim().length > 0 && !busy;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressStyle(pressed, reduceMotion)]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Avatar name={name} label={initials(name)} tone={tone} size={40} />
        <View style={styles.headerCopy}>
          <Text style={[styles.headerName, font.bold]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.headerSub, font.medium, { color: matiere ? tone.fg : colors.muted }]} numberOfLines={1}>
            {matiere || "Professeur"}
            {selected ? ` · ${selected.prenom}` : ""}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {loading && messages.length === 0 ? <Skeleton height={56} count={3} /> : null}
        {error ? <LoadError message={error} onRetry={() => filId && load(filId)} /> : null}

        {messages.map((message, index) => {
          const mine = message.auteurId === user?.id;
          const prev = messages[index - 1];
          const next = messages[index + 1];
          const newDay = !prev || !sameDay(prev.createdAt, message.createdAt);
          const groupedWithNext =
            next && next.auteurId === message.auteurId && sameDay(next.createdAt, message.createdAt);
          const groupedWithPrev = !newDay && prev && prev.auteurId === message.auteurId;
          return (
            <Fragment key={message.id}>
              {newDay ? (
                <View style={styles.dayRow}>
                  <Text style={[styles.dayText, font.semibold]}>{dayLabel(message.createdAt)}</Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  mine ? styles.mine : styles.theirs,
                  groupedWithPrev && styles.tightTop,
                  mine && groupedWithNext && styles.mineJoined,
                  !mine && groupedWithNext && styles.theirsJoined,
                ]}
              >
                <Text style={[styles.body, font.regular, mine && styles.bodyMine]}>{message.corps}</Text>
                {!groupedWithNext ? (
                  <Text style={[styles.stamp, font.medium, mine && styles.stampMine]}>{formatTime(message.createdAt)}</Text>
                ) : null}
              </View>
            </Fragment>
          );
        })}

        {!loading && !error && messages.length === 0 ? (
          <View style={styles.empty}>
            <Avatar name={name} label={initials(name)} tone={tone} size={72} />
            <Text style={[styles.emptyTitle, font.bold]}>{filId ? "Aucun message" : `Écrire à ${name}`}</Text>
            <Text style={[styles.emptyBody, font.regular]}>
              {filId
                ? "Les réponses du professeur apparaîtront ici."
                : `Le professeur recevra votre message au sujet de ${selected?.prenom ?? "votre enfant"}.`}
            </Text>
            {!filId ? (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((text) => (
                  <Pressable
                    key={text}
                    accessibilityRole="button"
                    accessibilityLabel={`Utiliser : ${text}`}
                    onPress={() => {
                      setCorps(text);
                      inputRef.current?.focus();
                    }}
                    style={({ pressed }) => [styles.suggestion, pressStyle(pressed, reduceMotion)]}
                  >
                    <Text style={[styles.suggestionText, font.medium]}>{text}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {sendError ? (
          <Text style={[styles.sendError, font.medium]} accessibilityRole="alert">
            {sendError}
          </Text>
        ) : null}
        <View style={styles.composerRow}>
          <TextInput
            ref={inputRef}
            accessibilityLabel="Votre message"
            style={[styles.input, font.regular]}
            placeholder="Écrire un message…"
            placeholderTextColor={colors.muted}
            value={corps}
            onChangeText={(value) => {
              setCorps(value);
              if (sendError) setSendError(null);
            }}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer le message"
            accessibilityState={{ disabled: !canSend }}
            onPress={send}
            disabled={!canSend}
            style={({ pressed }) => [styles.send, !canSend && styles.sendOff, pressStyle(pressed, reduceMotion)]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={22} color={colors.white} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: { width: hit.min - 8, height: hit.min, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, gap: 1 },
  headerName: { fontSize: 16, color: colors.text },
  headerSub: { fontSize: 12 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, gap: 6 },
  dayRow: { alignItems: "center", marginVertical: 10 },
  dayText: {
    fontSize: 12,
    color: colors.muted,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: "hidden",
  },
  bubble: { maxWidth: "80%", paddingHorizontal: 14, paddingTop: 9, paddingBottom: 7, borderRadius: 20, marginTop: 4 },
  tightTop: { marginTop: -2 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  mineJoined: { borderBottomRightRadius: 20, borderTopRightRadius: 20 },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.white, borderBottomLeftRadius: 6, ...shadow.card },
  theirsJoined: { borderBottomLeftRadius: 20 },
  body: { fontSize: 15, lineHeight: 21, color: colors.text },
  bodyMine: { color: colors.white },
  stamp: { fontSize: 10.5, color: colors.muted, alignSelf: "flex-end", marginTop: 3 },
  stampMine: { color: "rgba(255,255,255,0.75)" },
  empty: { alignItems: "center", gap: 8, paddingTop: 40, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 18, color: colors.text, marginTop: 6, textAlign: "center" },
  emptyBody: { fontSize: 14, color: colors.muted, lineHeight: 20, textAlign: "center" },
  suggestions: { alignSelf: "stretch", gap: 8, marginTop: 14 },
  suggestion: {
    minHeight: hit.min,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  suggestionText: { fontSize: 14, color: colors.primary },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 6,
  },
  composerRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  sendError: { color: colors.fail, fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
  input: {
    flex: 1,
    minHeight: hit.min,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: type.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  send: {
    width: hit.min,
    height: hit.min,
    borderRadius: hit.min / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendOff: { backgroundColor: colors.border },
});
