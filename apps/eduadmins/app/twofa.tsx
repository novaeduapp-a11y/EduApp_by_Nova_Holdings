import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "@/context/session";
import { colors } from "@/lib/theme";

export default function TwoFaScreen() {
  const router = useRouter();
  const { confirm2fa } = useSession();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!challengeId) return;
    setBusy(true);
    setMessage(null);
    try {
      await confirm2fa(challengeId, code.trim());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Code invalide");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
        <Text style={styles.title}>Code A2F</Text>
        <Text style={styles.sub}>Saisissez le code à 6 chiffres reçu pour valider la connexion.</Text>
        <TextInput
          accessibilityLabel="Code à 6 chiffres"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          style={styles.input}
        />
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={busy || code.length !== 6}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.buttonText}>{busy ? "Vérification..." : "Valider"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 22, gap: 12 },
  back: { minHeight: 44, justifyContent: "center" },
  backText: { color: colors.primary, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  sub: { color: colors.muted, lineHeight: 22 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    color: colors.text,
  },
  error: { color: colors.fail },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
