import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { SectionHead } from "@/components/SectionHead";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { deleteComptePhoto, fetchCompte, updateCompte, updateComptePassword, updateComptePhoto } from "@/lib/api";
import { pickProfilePhoto } from "@/lib/photo";
import { colors, font, hit, pressStyle, radius, shadow, type, useReduceMotion } from "@/lib/theme";

type Compte = Awaited<ReturnType<typeof fetchCompte>>["data"];
type Field = "prenom" | "nom" | "telephone";

const FIELDS: Array<{ key: Field; label: string; icon: keyof typeof Ionicons.glyphMap; keyboard?: "phone-pad" }> = [
  { key: "prenom", label: "Prénom", icon: "person-outline" },
  { key: "nom", label: "Nom", icon: "person-outline" },
  { key: "telephone", label: "Téléphone", icon: "call-outline", keyboard: "phone-pad" },
];

export default function ProfilScreen() {
  const reduceMotion = useReduceMotion();
  const { photo, setPhoto, selectChild, selected } = useSession();
  const [compte, setCompte] = useState<Compte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<Field, string>>({ prenom: "", nom: "", telephone: "" });
  const [emailLocked, setEmailLocked] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const canChangePassword = passwords.currentPassword.length > 0 && passwords.newPassword.length >= 8;

  const load = useCallback(async () => {
    setError(null);
    const res = await fetchCompte();
    setCompte(res.data);
    setPhoto(res.data.profil.photo ?? null);
    const p = res.data.profil;
    setForm({ prenom: p.prenom, nom: p.nom, telephone: p.telephone ?? "" });
    setEmailLocked(p.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err, "Impossible de charger le profil")))
        .finally(() => setLoading(false));
    }, [load])
  );

  const profil = compte?.profil;
  const dirty = useMemo(() => {
    if (!profil) return false;
    return (
      form.prenom !== profil.prenom ||
      form.nom !== profil.nom ||
      form.telephone !== (profil.telephone ?? "")
    );
  }, [form, profil]);

  const changePhoto = async (source: "camera" | "library") => {
    setPhotoMenu(false);
    setError(null);
    try {
      const next = await pickProfilePhoto(source);
      if (!next) return;
      setPhotoBusy(true);
      await updateComptePhoto(next);
      setPhoto(next);
    } catch (err) {
      setError(loadErrorMessage(err, "Impossible de changer la photo"));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoMenu(false);
    setError(null);
    setPhotoBusy(true);
    try {
      await deleteComptePhoto();
      setPhoto(null);
    } catch (err) {
      setError(loadErrorMessage(err, "Impossible de supprimer la photo"));
    } finally {
      setPhotoBusy(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateCompte({
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: emailLocked,
        telephone: form.telephone.trim() || null,
      });
      await load();
      setSaved(true);
    } catch (err) {
      setError(loadErrorMessage(err, "Impossible d’enregistrer le profil"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      onRefresh={async () => {
        try {
          await load();
        } catch (err) {
          setError(loadErrorMessage(err, "Impossible de charger le profil"));
        }
      }}
    >
      <PageTitle title="Mon profil" showBack />

      {loading && !compte ? <Skeleton count={3} /> : null}
      {error ? <LoadError message={error} onRetry={() => load().catch((err) => setError(loadErrorMessage(err)))} /> : null}

      {profil ? (
        <Enter>
          <Card style={styles.hero}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Changer la photo de profil"
              onPress={() => setPhotoMenu((open) => !open)}
              disabled={photoBusy}
              style={({ pressed }) => [styles.avatarWrap, pressStyle(pressed, reduceMotion)]}
            >
              <Avatar photo={photo} name={profil.prenom} size={104} />
              {photoBusy ? (
                <View style={styles.avatarBusy}>
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : null}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </Pressable>
            <Text style={[styles.name, font.bold]}>
              {profil.prenom} {profil.nom}
            </Text>
            <Text style={[styles.role, font.medium]}>{profil.role}</Text>

            {photoMenu ? (
              <View style={styles.photoActions}>
                <PhotoAction icon="camera-outline" label="Appareil photo" onPress={() => changePhoto("camera")} />
                <PhotoAction icon="images-outline" label="Galerie" onPress={() => changePhoto("library")} />
                {photo ? <PhotoAction icon="trash-outline" label="Supprimer" danger onPress={removePhoto} /> : null}
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setPhotoMenu(true)}
                disabled={photoBusy}
                style={styles.photoLink}
              >
                <Text style={[styles.photoLinkText, font.semibold]}>
                  {photo ? "Modifier la photo" : "Ajouter une photo"}
                </Text>
              </Pressable>
            )}
          </Card>
        </Enter>
      ) : null}

      {profil ? (
        <Enter index={1}>
          <Card>
            <SectionHead icon="id-card-outline" title="Informations" chevron={false} />
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={[styles.label, font.medium]}>E-mail de connexion</Text>
                <View style={[styles.inputWrap, styles.inputLocked]}>
                  <Ionicons name="mail-outline" size={18} color={colors.muted} />
                  <Text style={[styles.lockedValue, font.regular]} numberOfLines={1}>
                    {emailLocked}
                  </Text>
                  <Ionicons name="lock-closed" size={16} color={colors.muted} />
                </View>
                <Text style={[styles.lockHint, font.regular]}>
                  Géré par l’établissement — non modifiable ici.
                </Text>
              </View>
              {FIELDS.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text nativeID={`${field.key}-label`} style={[styles.label, font.medium]}>
                    {field.label}
                  </Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name={field.icon} size={18} color={colors.muted} />
                    <TextInput
                      accessibilityLabelledBy={`${field.key}-label`}
                      accessibilityLabel={field.label}
                      value={form[field.key]}
                      onChangeText={(value) => {
                        setSaved(false);
                        setForm((current) => ({ ...current, [field.key]: value }));
                      }}
                      keyboardType={field.keyboard ?? "default"}
                      autoCapitalize="words"
                      autoCorrect={false}
                      style={[styles.input, font.regular]}
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !dirty || saving }}
              disabled={!dirty || saving}
              onPress={save}
              style={({ pressed }) => [styles.save, (!dirty || saving) && styles.saveOff, pressStyle(pressed, reduceMotion)]}
            >
              <Text style={[styles.saveText, font.bold]}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
            </Pressable>
            {saved ? (
              <View style={styles.savedRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.good} />
                <Text style={[styles.savedText, font.medium]}>Profil enregistré</Text>
              </View>
            ) : null}
          </Card>
        </Enter>
      ) : null}

      {profil ? (
        <Enter index={2}>
          <Card>
            <SectionHead icon="lock-closed-outline" title="Mot de passe" chevron={false} />
            {passwordNotice ? (
              <View style={styles.passwordNotice}>
                <Ionicons name="checkmark-circle" size={16} color={colors.good} />
                <Text style={[styles.passwordNoticeText, font.medium]}>{passwordNotice}</Text>
              </View>
            ) : null}
            <View style={styles.fields}>
              <TextInput
                accessibilityLabel="Mot de passe actuel"
                secureTextEntry={!showPassword}
                value={passwords.currentPassword}
                onChangeText={(currentPassword) => {
                  setPasswordNotice(null);
                  setPasswords((current) => ({ ...current, currentPassword }));
                }}
                placeholder="Mot de passe actuel"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                style={[styles.passwordInput, font.regular]}
              />
              <TextInput
                accessibilityLabel="Nouveau mot de passe"
                secureTextEntry={!showPassword}
                value={passwords.newPassword}
                onChangeText={(newPassword) => {
                  setPasswordNotice(null);
                  setPasswords((current) => ({ ...current, newPassword }));
                }}
                placeholder="Nouveau mot de passe (8 caractères min.)"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                style={[styles.passwordInput, font.regular]}
              />
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: showPassword }}
                onPress={() => setShowPassword((v) => !v)}
                style={styles.toggle}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.primary} />
                <Text style={[styles.toggleText, font.medium]}>
                  {showPassword ? "Masquer" : "Afficher"} les mots de passe
                </Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: passwordBusy || !canChangePassword }}
              disabled={passwordBusy || !canChangePassword}
              onPress={async () => {
                setPasswordBusy(true);
                setError(null);
                setPasswordNotice(null);
                try {
                  await updateComptePassword(passwords.currentPassword, passwords.newPassword);
                  setPasswords({ currentPassword: "", newPassword: "" });
                  setPasswordNotice("Mot de passe modifié");
                } catch (err) {
                  setError(loadErrorMessage(err, "Impossible de modifier le mot de passe"));
                } finally {
                  setPasswordBusy(false);
                }
              }}
              style={({ pressed }) => [
                styles.save,
                (passwordBusy || !canChangePassword) && styles.saveOff,
                pressStyle(pressed, reduceMotion),
              ]}
            >
              <Text style={[styles.saveText, font.bold]}>
                {passwordBusy ? "Modification…" : "Modifier le mot de passe"}
              </Text>
            </Pressable>
          </Card>
        </Enter>
      ) : null}

      {compte?.enfants.length ? (
        <Enter index={3}>
          <Card>
            <SectionHead
              icon="people-outline"
              title="Mes enfants"
              action={`${compte.enfants.length}`}
              chevron={false}
            />
            {compte.enfants.map((enfant, i) => {
              const active = selected?.id === enfant.id;
              return (
                <Pressable
                  key={enfant.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${enfant.prenom} ${enfant.nom}, ${enfant.classe}${active ? ", sélectionné" : ""}`}
                  onPress={() => selectChild(enfant.id)}
                  style={[styles.child, i > 0 && styles.divider]}
                >
                  <Avatar name={enfant.prenom} size={40} />
                  <View style={styles.childCopy}>
                    <Text style={[styles.childName, font.semibold]}>
                      {enfant.prenom} {enfant.nom}
                    </Text>
                    <Text style={[styles.meta, font.regular]}>
                      {enfant.classe} · {enfant.relation} · {enfant.matricule}
                    </Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </Card>
        </Enter>
      ) : null}
    </Screen>
  );
}

function PhotoAction({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const reduceMotion = useReduceMotion();
  const tint = danger ? colors.fail : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.photoAction,
        { backgroundColor: danger ? colors.failSoft : colors.tint },
        pressStyle(pressed, reduceMotion),
      ]}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={[styles.photoActionText, font.semibold, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 4, paddingVertical: 24 },
  avatarWrap: { marginBottom: 10 },
  avatarBusy: {
    ...StyleSheet.absoluteFill,
    borderRadius: 52,
    backgroundColor: "rgba(11,47,122,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  name: { fontSize: type.heading, color: colors.text, textAlign: "center" },
  role: { fontSize: type.meta, color: colors.muted },
  photoLink: { minHeight: hit.min, justifyContent: "center", paddingHorizontal: 12 },
  photoLinkText: { fontSize: 15, color: colors.primary },
  photoActions: { flexDirection: "row", gap: 8, marginTop: 12, alignSelf: "stretch" },
  photoAction: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoActionText: { fontSize: 12 },
  fields: { gap: 12 },
  field: { gap: 6 },
  label: { fontSize: type.meta, color: colors.muted },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: colors.background,
  },
  inputLocked: { opacity: 0.92 },
  lockedValue: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12 },
  lockHint: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12 },
  save: {
    minHeight: 50,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 16,
  },
  saveOff: { opacity: 0.45 },
  saveText: { color: colors.white, fontSize: type.body },
  savedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 },
  savedText: { fontSize: 14, color: colors.good },
  passwordInput: {
    minHeight: 50,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  toggle: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: hit.min, alignSelf: "flex-start" },
  toggleText: { fontSize: 14, color: colors.primary },
  passwordNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  passwordNoticeText: { fontSize: 14, color: colors.good },
  child: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 8 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  childCopy: { flex: 1, gap: 2 },
  childName: { fontSize: 15, color: colors.text },
  meta: { fontSize: type.meta, color: colors.muted },
});
