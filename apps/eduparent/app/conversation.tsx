import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchConversation, replyToFil, startConversation } from "@/lib/api";
import { colors, font, hit, pressStyle, radius, shadow, space, type, useReduceMotion } from "@/lib/theme";

type Message = Awaited<ReturnType<typeof fetchConversation>>["data"]["messages"][number];

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { selected, user } = useSession();
  const params = useLocalSearchParams<{ filId?: string; professeurId?: string; name?: string; eleveId?: string }>();
  const eleveId = params.eleveId || selected?.id;
  const [filId, setFilId] = useState(params.filId && params.filId !== "new" ? params.filId : null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [corps, setCorps] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const load = async (id: string) => {
    if (!eleveId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchConversation(eleveId, id);
      setMessages(res.data.messages);
    } catch (err) {
      setError(loadErrorMessage(err, "Impossible de charger la conversation. Vérifiez votre connexion et réessayez."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filId && eleveId) load(filId);
  }, [filId, eleveId]);

  const send = async () => {
    if (!eleveId) return;
    if (!corps.trim()) {
      setSendError("Saisissez un message.");
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setSendError(null);
    try {
      if (filId) {
        await replyToFil(eleveId, filId, corps.trim());
        setCorps("");
        await load(filId);
      } else if (params.professeurId) {
        const created = await startConversation(eleveId, params.professeurId, corps.trim());
        setCorps("");
        setFilId(created.data.filId);
      }
    } catch (err) {
      setSendError(
        err instanceof Error && err.message.trim()
          ? err.message
          : "Impossible d’envoyer. Vérifiez votre connexion et réessayez."
      );
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingHorizontal: space.screen },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title={params.name ?? "Conversation"} />
        {loading && messages.length === 0 ? <Skeleton height={64} count={3} /> : null}
        {error ? <LoadError message={error} onRetry={() => filId && load(filId)} /> : null}
        {messages.map((message, index) => {
          const mine = message.auteurId === user?.id;
          return (
            <Enter key={message.id} index={Math.min(index, 6)}>
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.body, font.regular, mine && styles.bodyMine]}>{message.corps}</Text>
              </View>
            </Enter>
          );
        })}
        {!loading && !error && messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Aucun message"
            body={
              filId
                ? "Les réponses du professeur apparaîtront ici."
                : `Écrivez le premier message au professeur de ${selected?.prenom}.`
            }
          />
        ) : null}
      </ScrollView>
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {sendError ? (
          <Text style={[styles.sendError, font.medium]} accessibilityRole="alert">
            {sendError}
          </Text>
        ) : null}
        <View style={styles.composerRow}>
          <TextInput
            ref={inputRef}
            accessibilityLabel="Votre message"
            accessibilityState={{ disabled: busy }}
            style={[styles.input, font.regular]}
            placeholder="Votre message"
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
            onPress={send}
            disabled={busy}
            style={({ pressed }) => [styles.send, pressStyle(pressed, reduceMotion), busy && { opacity: 0.5 }]}
          >
            <Text style={[styles.sendText, font.bold]}>{busy ? "…" : "Envoyer"}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: 10, paddingBottom: 24 },
  bubble: { maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 10 },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    ...shadow.card,
  },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  bodyMine: { color: colors.white },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  composer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.white,
    ...shadow.bar,
    gap: 8,
  },
  composerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  sendError: { color: colors.fail, fontSize: 14, lineHeight: 20 },
  input: {
    flex: 1,
    minHeight: hit.min,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: type.body,
    color: colors.text,
  },
  send: {
    minHeight: hit.min,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: colors.white, fontWeight: "700" },
});
