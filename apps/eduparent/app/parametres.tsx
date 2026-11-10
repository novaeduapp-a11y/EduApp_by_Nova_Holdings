import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { BrandFooter } from "@/components/BrandLockup";
import { Card } from "@/components/Card";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { NavRow } from "@/components/NavRow";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { SectionHead } from "@/components/SectionHead";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { closeCompte, fetchCompte, updateCompte2fa } from "@/lib/api";
import { EDUADMIN_CONTACT, LEGAL_URLS, NOVA_CONTACT } from "@/lib/contact";
import { colors, font, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

function openTel(value: string) {
  const digits = value.replace(/\s/g, "");
  if (!digits) return;
  Linking.openURL(`tel:${digits}`).catch(() => undefined);
}

function openMail(value: string) {
  if (!value) return;
  Linking.openURL(`mailto:${value}`).catch(() => undefined);
}

function openUrl(url: string) {
  Linking.openURL(url).catch(() => undefined);
}

export default function ParametresScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { logout } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [compte, setCompte] = useState<Awaited<ReturnType<typeof fetchCompte>>["data"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [closing, setClosing] = useState<"desactiver" | "supprimer" | null>(null);
  const [closePassword, setClosePassword] = useState("");
  const [closeConfirm, setCloseConfirm] = useState("");
  const version = Constants.expoConfig?.version ?? "1.0.2";

  const load = useCallback(async () => {
    setError(null);
    const res = await fetchCompte();
    setCompte(res.data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les paramètres")))
        .finally(() => setLoading(false));
    }, [load])
  );

  const run = async (action: () => Promise<void>, fallback: string, success?: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (success) setNotice(success);
    } catch (err) {
      setError(loadErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const ecole = compte?.etablissement;
  const twoFa = Boolean(compte?.profil.twoFactorEnabled);
  const canClose =
    !busy &&
    closePassword.length > 0 &&
    (closing !== "supprimer" || closeConfirm.trim().toUpperCase() === "SUPPRIMER");

  return (
    <Screen
      onRefresh={async () => {
        try {
          await load();
        } catch (err) {
          setError(loadErrorMessage(err, "Impossible de charger les paramètres"));
        }
      }}
    >
      <PageTitle title="Paramètres" showBack />

      {loading && !compte ? <Skeleton count={3} /> : null}
      {error ? <LoadError message={error} onRetry={() => load().catch((err) => setError(loadErrorMessage(err)))} /> : null}
      {notice ? (
        <View style={styles.notice}>
          <Ionicons name="checkmark-circle" size={18} color={colors.good} />
          <Text style={[styles.noticeText, font.medium]}>{notice}</Text>
        </View>
      ) : null}

      <Enter>
        <NavRow
          icon="person-circle-outline"
          title="Profil"
          subtitle="Photo, nom, e-mail, téléphone, mot de passe"
          onPress={() => router.push("/profil" as Href)}
        />
      </Enter>

      <Enter index={1}>
        <Card>
          <SectionHead icon="shield-checkmark-outline" title="Sécurité du compte" chevron={false} />
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: twoFa ? colors.good : colors.muted }]} />
            <Text style={[styles.body, font.regular]}>
              {twoFa
                ? "Protection activée."
                : "Protection désactivée. Activez-la pour mieux protéger le compte."}
            </Text>
          </View>
          {challengeId ? (
            <>
              <TextInput
                accessibilityLabel="Code à 6 chiffres"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Code à 6 chiffres"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.code, font.semibold]}
              />
              <Pressable
                accessibilityRole="button"
                disabled={busy || code.length !== 6}
                onPress={() =>
                  run(
                    async () => {
                      await updateCompte2fa({ action: "enable", challengeId, code });
                      setChallengeId(null);
                      setCode("");
                      await load();
                    },
                    "Code refusé",
                    "Sécurité du compte activée"
                  )
                }
                style={({ pressed }) => [styles.primary, (busy || code.length !== 6) && styles.off, pressStyle(pressed, reduceMotion)]}
              >
                <Text style={[styles.primaryText, font.bold]}>Confirmer</Text>
              </Pressable>
            </>
          ) : twoFa ? (
            <>
              <TextInput
                accessibilityLabel="Mot de passe pour désactiver"
                secureTextEntry
                value={disablePassword}
                onChangeText={setDisablePassword}
                placeholder="Mot de passe"
                placeholderTextColor={colors.muted}
                style={[styles.input, { marginTop: 12 }, font.regular]}
              />
              <Pressable
                accessibilityRole="button"
                disabled={busy || !disablePassword}
                onPress={() =>
                  run(
                    async () => {
                      await updateCompte2fa({ action: "disable", password: disablePassword });
                      setDisablePassword("");
                      await load();
                    },
                    "Impossible de désactiver",
                    "Sécurité du compte désactivée"
                  )
                }
                style={({ pressed }) => [styles.secondary, (busy || !disablePassword) && styles.off, pressStyle(pressed, reduceMotion)]}
              >
                <Text style={[styles.secondaryText, font.bold]}>Désactiver</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() =>
                run(async () => {
                  const res = await updateCompte2fa({ action: "start" });
                  setChallengeId(res.data.challengeId ?? null);
                  setCode("");
                }, "Impossible d’activer")
              }
              style={({ pressed }) => [styles.primary, busy && styles.off, pressStyle(pressed, reduceMotion)]}
            >
              <Text style={[styles.primaryText, font.bold]}>Activer</Text>
            </Pressable>
          )}
        </Card>
      </Enter>

      {ecole ? (
        <Enter index={2}>
          <Card>
            <SectionHead icon="school-outline" title="Établissement" chevron={false} />
            <Text style={[styles.schoolName, font.bold]}>{ecole.nom}</Text>
            {ecole.anneeScolaire ? (
              <Text style={[styles.meta, font.regular]}>Année scolaire {ecole.anneeScolaire}</Text>
            ) : null}
            {ecole.adresse || ecole.ville ? (
              <Text style={[styles.body, font.regular, { marginTop: 6 }]}>
                {[ecole.adresse, ecole.ville].filter(Boolean).join(", ")}
              </Text>
            ) : null}
            <View style={styles.contactRow}>
              {ecole.telephone ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Appeler l’établissement ${ecole.telephone}`}
                  onPress={() => openTel(ecole.telephone)}
                  style={({ pressed }) => [styles.contact, pressStyle(pressed, reduceMotion)]}
                >
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                  <Text style={[styles.contactText, font.semibold]}>Appeler</Text>
                </Pressable>
              ) : null}
              {ecole.email ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Écrire à ${ecole.email}`}
                  onPress={() => openMail(ecole.email)}
                  style={({ pressed }) => [styles.contact, pressStyle(pressed, reduceMotion)]}
                >
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text style={[styles.contactText, font.semibold]}>E-mail</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        </Enter>
      ) : null}

      <Enter index={ecole ? 3 : 2}>
        <Card>
          <SectionHead icon="help-circle-outline" title="Assistance et documents légaux" chevron={false} />
          <Text style={[styles.body, font.regular]}>Support technique EduParent · NOVA HOLDINGS</Text>
          {NOVA_CONTACT.phones.map((phone) => (
            <Pressable
              key={phone.href}
              accessibilityRole="link"
              accessibilityLabel={`Appeler ${phone.label}`}
              onPress={() => Linking.openURL(phone.href).catch(() => undefined)}
              style={({ pressed }) => [styles.phoneRow, pressStyle(pressed, reduceMotion)]}
            >
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.contactText, font.semibold]}>{phone.label}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Écrire à ${EDUADMIN_CONTACT.email}`}
            onPress={() => Linking.openURL(EDUADMIN_CONTACT.emailHref).catch(() => undefined)}
            style={({ pressed }) => [styles.contact, pressStyle(pressed, reduceMotion)]}
          >
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={[styles.contactText, font.semibold]}>{EDUADMIN_CONTACT.email}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Conditions d’utilisation"
            onPress={() => openUrl(LEGAL_URLS.conditions)}
            style={({ pressed }) => [styles.legalRow, pressStyle(pressed, reduceMotion)]}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.legalText, font.semibold]}>Conditions d’utilisation</Text>
            <Ionicons name="open-outline" size={16} color={colors.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Politique de confidentialité"
            onPress={() => openUrl(LEGAL_URLS.confidentialite)}
            style={({ pressed }) => [styles.legalRow, styles.divider, pressStyle(pressed, reduceMotion)]}
          >
            <Ionicons name="shield-outline" size={18} color={colors.primary} />
            <Text style={[styles.legalText, font.semibold]}>Politique de confidentialité</Text>
            <Ionicons name="open-outline" size={16} color={colors.muted} />
          </Pressable>
        </Card>
      </Enter>

      <Enter index={ecole ? 4 : 3}>
        <Card>
          <SectionHead icon="warning-outline" title="Gestion du compte" chevron={false} />
          {closing ? (
            <View style={styles.fields}>
              <View style={[styles.warnBox, closing === "supprimer" && styles.warnBoxDanger]}>
                <Text style={[styles.warnTitle, font.bold, closing === "supprimer" && { color: colors.fail }]}>
                  {closing === "supprimer" ? "Suppression définitive" : "Désactivation"}
                </Text>
                <Text style={[styles.warnBody, font.regular]}>
                  {closing === "supprimer"
                    ? "Votre nom, e-mail, téléphone et photo seront effacés, ainsi que vos notifications et le lien avec vos enfants. Cette action est irréversible. Les notes et absences restent gérées par l’établissement."
                    : "Vous serez déconnecté et ne pourrez plus vous connecter. Vos données sont conservées : l’établissement pourra réactiver votre compte sur demande."}
                </Text>
              </View>
              <TextInput
                accessibilityLabel="Mot de passe pour confirmer"
                secureTextEntry
                value={closePassword}
                onChangeText={setClosePassword}
                placeholder="Votre mot de passe"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                style={[styles.input, font.regular]}
              />
              {closing === "supprimer" ? (
                <TextInput
                  accessibilityLabel="Tapez SUPPRIMER pour confirmer"
                  value={closeConfirm}
                  onChangeText={setCloseConfirm}
                  placeholder="Tapez SUPPRIMER pour confirmer"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.input, font.semibold]}
                />
              ) : null}
              <View style={styles.closeRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setClosing(null);
                    setClosePassword("");
                    setCloseConfirm("");
                  }}
                  style={({ pressed }) => [styles.ghost, pressStyle(pressed, reduceMotion)]}
                >
                  <Text style={[styles.ghostText, font.bold]}>Annuler</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canClose }}
                  disabled={!canClose}
                  onPress={() =>
                    run(async () => {
                      await closeCompte(closing, closePassword);
                      Alert.alert(
                        closing === "supprimer" ? "Compte supprimé" : "Compte désactivé",
                        closing === "supprimer"
                          ? "Vos données personnelles ont été effacées."
                          : "Contactez l’établissement pour le réactiver."
                      );
                      await logout();
                    }, closing === "supprimer" ? "Impossible de supprimer le compte" : "Impossible de désactiver le compte")
                  }
                  style={({ pressed }) => [styles.danger, styles.dangerFlex, !canClose && styles.off, pressStyle(pressed, reduceMotion)]}
                >
                  <Text style={[styles.dangerText, font.bold]}>
                    {busy ? "Patientez…" : closing === "supprimer" ? "Supprimer" : "Désactiver"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.body, font.regular]}>
                Vous pouvez suspendre votre compte ou le supprimer avec vos données personnelles.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setClosing("desactiver")}
                style={({ pressed }) => [styles.closeOption, pressStyle(pressed, reduceMotion)]}
              >
                <Ionicons name="pause-circle-outline" size={20} color={colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.closeTitle, font.semibold]}>Désactiver mon compte</Text>
                  <Text style={[styles.meta, font.regular]}>Réactivable par l’établissement</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setClosing("supprimer")}
                style={({ pressed }) => [styles.closeOption, styles.divider, pressStyle(pressed, reduceMotion)]}
              >
                <Ionicons name="trash-outline" size={20} color={colors.fail} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.closeTitle, font.semibold, { color: colors.fail }]}>Supprimer mon compte</Text>
                  <Text style={[styles.meta, font.regular]}>Définitif, données personnelles effacées</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            </>
          )}
        </Card>
      </Enter>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
        onPress={() => logout()}
        style={({ pressed }) => [styles.out, pressStyle(pressed, reduceMotion)]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.fail} />
        <Text style={[styles.outText, font.bold]}>Se déconnecter</Text>
      </Pressable>

      <BrandFooter version={version} compact />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: colors.goodSoft,
  },
  noticeText: { fontSize: 14, color: colors.good },
  fields: { gap: 10 },
  input: {
    minHeight: 50,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  code: { marginTop: 12, letterSpacing: 8, textAlign: "center", fontSize: 20 },
  primary: {
    minHeight: 50,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 12,
  },
  primaryText: { color: colors.white, fontSize: type.body },
  secondary: {
    minHeight: 50,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.failSoft,
    marginTop: 12,
  },
  secondaryText: { color: colors.fail, fontSize: type.body },
  off: { opacity: 0.45 },
  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  body: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },
  schoolName: { fontSize: type.body, color: colors.text },
  meta: { fontSize: type.meta, color: colors.muted, marginTop: 2 },
  contactRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  assistRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: radius.control,
    backgroundColor: colors.tint,
  },
  contact: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.tint,
  },
  contactText: { fontSize: 15, color: colors.primary },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    marginTop: 8,
  },
  legalText: { flex: 1, fontSize: 15, color: colors.text },
  out: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.failSoft,
  },
  outText: { color: colors.fail, fontSize: type.body },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  closeOption: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 8 },
  closeTitle: { fontSize: 15, color: colors.text },
  warnBox: { borderRadius: 14, padding: 14, gap: 6, backgroundColor: colors.background },
  warnBoxDanger: { backgroundColor: colors.failSoft },
  warnTitle: { fontSize: 15, color: colors.text },
  warnBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  closeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  ghost: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  ghostText: { color: colors.text, fontSize: type.body },
  danger: {
    minHeight: 50,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.fail,
  },
  dangerFlex: { flex: 1 },
  dangerText: { color: colors.white, fontSize: type.body },
});
