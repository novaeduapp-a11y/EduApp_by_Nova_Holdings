import { useEffect, useState } from "react";
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
import { BrandLogo } from "@/components/BrandLockup";
import { changeForcedPassword, takeForcedPasswordPending } from "@/lib/api";
import { colors, font, pressStyle, radius, shadow, type, useReduceMotion } from "@/lib/theme";

export default function ChangerMotDePasseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [focus, setFocus] = useState<"new" | "confirm" | null>(null);

  useEffect(() => {
    const pending = takeForcedPasswordPending();
    if (!pending) {
      router.replace("/login");
      return;
    }
    setUserId(pending.userId);
    setCurrentPassword(pending.currentPassword);
  }, [router]);

  const onSubmit = async () => {
    if (!userId) return;
    if (newPassword.length < 8) {
      setMessage("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword === currentPassword) {
      setMessage("Choisissez un mot de passe différent de l’actuel.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await changeForcedPassword({
        userId,
        currentPassword,
        newPassword,
        confirmPassword,
      });
      router.replace({
        pathname: "/login",
        params: { reset: "1" },
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Impossible de changer le mot de passe");
    } finally {
      setBusy(false);
    }
  };

  if (!userId) {
    return <View style={styles.screen} />;
  }

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
            <BrandLogo brand="eduapps" size="lg" />
            <Text style={[styles.title, font.bold]}>Nouveau mot de passe</Text>
            <Text style={[styles.lead, font.regular]}>
              Votre établissement a demandé un changement de mot de passe avant d’accéder à EduParent.
            </Text>
          </View>

          <View style={[styles.formCard, shadow.card]}>
            <Text nativeID="new-label" style={[styles.label, font.semibold]}>
              Nouveau mot de passe
            </Text>
            <TextInput
              accessibilityLabel="Nouveau mot de passe"
              accessibilityLabelledBy="new-label"
              secureTextEntry={!showNew}
              textContentType="newPassword"
              autoComplete="password-new"
              value={newPassword}
              onChangeText={setNewPassword}
              onFocus={() => setFocus("new")}
              onBlur={() => setFocus(null)}
              style={[styles.input, font.regular, focus === "new" && styles.inputFocus]}
              placeholder="Au moins 8 caractères"
              placeholderTextColor={colors.muted}
            />

            <Text nativeID="confirm-label" style={[styles.label, font.semibold]}>
              Confirmer
            </Text>
            <TextInput
              accessibilityLabel="Confirmer le mot de passe"
              accessibilityLabelledBy="confirm-label"
              secureTextEntry={!showNew}
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocus("confirm")}
              onBlur={() => setFocus(null)}
              style={[styles.input, font.regular, focus === "confirm" && styles.inputFocus]}
              placeholder="Retapez le mot de passe"
              placeholderTextColor={colors.muted}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onPress={() => setShowNew((value) => !value)}
              hitSlop={8}
              style={styles.toggle}
            >
              <Text style={[styles.toggleText, font.semibold]}>
                {showNew ? "Masquer" : "Afficher"} le mot de passe
              </Text>
            </Pressable>

            {message ? (
              <Text style={[styles.error, font.medium]} accessibilityRole="alert">
                {message}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enregistrer le mot de passe"
              onPress={onSubmit}
              disabled={busy}
              style={({ pressed }) => [styles.button, pressStyle(pressed, reduceMotion), busy && styles.disabled]}
            >
              <LinearGradient
                colors={[colors.primaryDeep, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonFill}
              >
                <Text style={[styles.buttonText, font.bold]}>
                  {busy ? "Enregistrement…" : "Enregistrer et se reconnecter"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour à la connexion"
              onPress={() => router.replace("/login")}
              style={styles.backBtn}
            >
              <Text style={[font.medium, styles.backText]}>Retour</Text>
            </Pressable>
          </View>
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
    gap: 24,
  },
  header: { alignItems: "center", gap: 10 },
  title: { fontSize: 26, color: colors.text, letterSpacing: -0.4, textAlign: "center" },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 22, textAlign: "center", maxWidth: 320 },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 2,
  },
  label: { fontSize: 14, color: colors.text, marginTop: 10 },
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
  toggle: { minHeight: 40, justifyContent: "center", marginTop: 6 },
  toggleText: { fontSize: 13, color: colors.primary },
  error: { color: colors.fail, marginTop: 8, fontSize: 14, lineHeight: 20 },
  button: { marginTop: 16, borderRadius: radius.control, overflow: "hidden" },
  buttonFill: { minHeight: 54, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonText: { color: colors.white, fontSize: type.body, textAlign: "center" },
  disabled: { opacity: 0.65 },
  backBtn: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 4 },
  backText: { color: colors.primary },
});
