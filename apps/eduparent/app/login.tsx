import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSession } from "@/context/session";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
  const { login } = useSession();
  const [email, setEmail] = useState("parent@ecole.sn");
  const [password, setPassword] = useState("Admin@123");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>EduParent</Text>
        <Text style={styles.sub}>NOVA HOLDINGS</Text>
        <Text nativeID="email-label" style={styles.label}>
          E-mail
        </Text>
        <TextInput
          accessibilityLabel="E-mail"
          accessibilityLabelledBy="email-label"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="parent@ecole.sn"
          placeholderTextColor={colors.muted}
        />
        <Text nativeID="password-label" style={styles.label}>
          Mot de passe
        </Text>
        <TextInput
          accessibilityLabel="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.muted}
        />
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={busy}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}
        >
          <Text style={styles.buttonText}>{busy ? "Connexion..." : "Se connecter"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    gap: 8,
  },
  brand: { fontSize: 28, fontWeight: "700", color: colors.primary, textAlign: "center" },
  sub: { fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  error: { color: colors.fail, marginTop: 8, fontSize: 14 },
  button: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  pressed: { transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.6 },
});
