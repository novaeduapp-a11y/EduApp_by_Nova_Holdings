import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "@/context/session";
import { colors, portails } from "@/lib/theme";
import type { Portail } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useSession();
  const params = useLocalSearchParams<{ portail?: string }>();
  const portail = (portails.find((p) => p.id === params.portail)?.id ?? "PROFESSEUR") as Portail;
  const meta = portails.find((p) => p.id === portail)!;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await login(email.trim(), password, portail);
      if (result.requires2fa && result.challengeId) {
        router.push({
          pathname: "/twofa",
          params: { challengeId: result.challengeId },
        });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>Portails</Text>
        </Pressable>
        <Image
          source={require("@/assets/eduapps-logo.png")}
          style={styles.logo}
          accessibilityLabel="EduApps"
          resizeMode="contain"
        />
        <Text style={styles.brand}>{meta.title}</Text>
        <Text style={styles.sub}>EduAdmins · mot de passe établissement</Text>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="votre@email.sn"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          accessibilityLabel="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={busy}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }, busy && { opacity: 0.6 }]}
        >
          <Text style={styles.buttonText}>{busy ? "Connexion..." : "Se connecter"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 22, gap: 10 },
  back: { minHeight: 44, justifyContent: "center" },
  backText: { color: colors.primary, fontWeight: "600" },
  logo: { width: 160, height: 44, marginBottom: 4 },
  brand: { fontSize: 24, fontWeight: "700", color: colors.text },
  sub: { color: colors.muted, marginBottom: 8 },
  label: { fontWeight: "600", color: colors.text, marginTop: 4 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  error: { color: colors.fail },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
