import { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "@/context/session";
import { BrandLogo } from "@/components/BrandLockup";
import { colors, font, pressStyle, radius, shadow, type, useReduceMotion } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { login, confirm2fa } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [focus, setFocus] = useState<"email" | "password" | "code" | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const onSubmit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (challengeId) {
        await confirm2fa(challengeId, code.trim());
        return;
      }
      const result = await login(email.trim(), password);
      if (result.requires2fa && result.challengeId) {
        setChallengeId(result.challengeId);
        setCode("");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#D8E6FF", colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BrandLogo brand="eduapps" size="hero" />
            <Text style={[styles.tagline, font.medium]}>Le suivi de vos enfants, simplement.</Text>
          </View>

          <View style={[styles.formCard, shadow.card]}>
            <Text style={[styles.sheetTitle, font.bold]}>{challengeId ? "Code A2F" : "Connexion"}</Text>
            <Text style={[styles.sheetSub, font.regular]}>
              {challengeId
                ? "Saisissez le code à 6 chiffres pour continuer."
                : "Espace réservé aux parents d’élèves."}
            </Text>

            {challengeId ? (
              <>
                <Text nativeID="code-label" style={[styles.label, font.semibold]}>
                  Code à 6 chiffres
                </Text>
                <TextInput
                  accessibilityLabel="Code à 6 chiffres"
                  accessibilityLabelledBy="code-label"
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  value={code}
                  onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
                  onFocus={() => setFocus("code")}
                  onBlur={() => setFocus(null)}
                  style={[styles.input, font.regular, focus === "code" && styles.inputFocus, styles.codeInput]}
                />
              </>
            ) : (
              <>
                <Text nativeID="email-label" style={[styles.label, font.semibold]}>
                  E-mail
                </Text>
                <TextInput
                  accessibilityLabel="E-mail"
                  accessibilityLabelledBy="email-label"
                  accessibilityDescribedBy={message ? "login-error" : undefined}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocus("email")}
                  onBlur={() => setFocus(null)}
                  style={[styles.input, font.regular, focus === "email" && styles.inputFocus]}
                  placeholder="votre@email.sn"
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.passwordRow}>
                  <Text nativeID="password-label" style={[styles.label, font.semibold, styles.passwordLabel]}>
                    Mot de passe
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mot de passe oublié"
                    onPress={() => router.push("/mot-de-passe-oublie")}
                    hitSlop={8}
                    style={({ pressed }) => pressStyle(pressed, reduceMotion)}
                  >
                    <Text style={[styles.forgot, font.semibold]}>Mot de passe oublié ?</Text>
                  </Pressable>
                </View>
                <TextInput
                  accessibilityLabel="Mot de passe"
                  accessibilityLabelledBy="password-label"
                  accessibilityDescribedBy={message ? "login-error" : undefined}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocus("password")}
                  onBlur={() => setFocus(null)}
                  style={[styles.input, font.regular, focus === "password" && styles.inputFocus]}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.muted}
                />
              </>
            )}

            {message ? (
              <Text nativeID="login-error" style={[styles.error, font.medium]} accessibilityRole="alert">
                {message}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={challengeId ? "Valider le code" : "Se connecter"}
              onPress={onSubmit}
              disabled={busy || (challengeId ? code.length !== 6 : false)}
              style={({ pressed }) => [styles.button, pressStyle(pressed, reduceMotion), busy && styles.disabled]}
            >
              <LinearGradient
                colors={[colors.primaryDeep, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonFill}
              >
                <Text style={[styles.buttonText, font.bold]}>
                  {busy ? "Vérification…" : challengeId ? "Valider le code" : "Se connecter"}
                </Text>
              </LinearGradient>
            </Pressable>

            {challengeId ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour"
                onPress={() => {
                  setChallengeId(null);
                  setCode("");
                  setMessage(null);
                }}
                style={styles.backBtn}
              >
                <Text style={[font.medium, styles.backText]}>Retour</Text>
              </Pressable>
            ) : null}
          </View>

          {!challengeId ? (
            <View style={styles.footerBrand}>
              <BrandLogo brand="nova" size="xl" />
              <Text style={[styles.owner, font.regular]}>Une solution NOVA HOLDINGS</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 28,
  },
  header: { alignItems: "center", gap: 12, paddingTop: 8 },
  tagline: { fontSize: 17, color: colors.muted, lineHeight: 24, textAlign: "center", maxWidth: 280 },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    gap: 2,
  },
  sheetTitle: { fontSize: 24, color: colors.text, letterSpacing: -0.4 },
  sheetSub: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 10 },
  label: { fontSize: 14, color: colors.text, marginTop: 8 },
  passwordRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  passwordLabel: { marginTop: 0, flex: 1 },
  forgot: { fontSize: 13, color: colors.primary },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: 16,
    fontSize: type.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputFocus: { borderColor: colors.primary, backgroundColor: colors.white },
  codeInput: { letterSpacing: 8, textAlign: "center", fontSize: 24 },
  error: { color: colors.fail, marginTop: 8, fontSize: 14, lineHeight: 20 },
  button: { marginTop: 20, borderRadius: radius.control, overflow: "hidden" },
  buttonFill: { minHeight: 54, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.white, fontSize: type.body },
  disabled: { opacity: 0.65 },
  backBtn: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 4 },
  backText: { color: colors.primary },
  footerBrand: { alignItems: "center", gap: 10, paddingBottom: 8 },
  owner: { fontSize: 13, color: colors.muted },
});
