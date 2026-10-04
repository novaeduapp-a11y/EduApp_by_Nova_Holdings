import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BrandFooter } from "@/components/BrandLockup";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { Card } from "@/components/Card";
import { Enter } from "@/components/Enter";
import { LoadError, loadErrorMessage } from "@/components/LoadError";
import { NavRow } from "@/components/NavRow";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/Skeleton";
import { useSession } from "@/context/session";
import { fetchCompte, updateCompte, updateCompte2fa, updateComptePassword } from "@/lib/api";
import { matchesQuery } from "@/lib/filter";
import { colors, font, hit, pressStyle, radius, type, useReduceMotion } from "@/lib/theme";

function openTel(value: string) {
  const digits = value.replace(/\s/g, "");
  if (!digits) return;
  Linking.openURL(`tel:${digits}`).catch(() => undefined);
}

function openMail(value: string) {
  if (!value) return;
  Linking.openURL(`mailto:${value}`).catch(() => undefined);
}

export default function ParametresScreen() {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { logout, selectChild } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compte, setCompte] = useState<Awaited<ReturnType<typeof fetchCompte>>["data"] | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const load = useCallback(async () => {
    setError(null);
    const res = await fetchCompte();
    setCompte(res.data);
    const profil = res.data.profil;
    setForm({
      prenom: profil.prenom,
      nom: profil.nom,
      email: profil.email,
      telephone: profil.telephone ?? "",
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les paramètres")))
        .finally(() => setLoading(false));
    }, [load])
  );

  const profil = compte?.profil;
  const ecole = compte?.etablissement;
  const enfants = useMemo(() => {
    const rows = compte?.enfants ?? [];
    return rows.filter((enfant) =>
      matchesQuery(query, enfant.prenom, enfant.nom, enfant.classe, enfant.matricule, enfant.relation)
    );
  }, [compte, query]);

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

      {loading && !compte ? <Skeleton count={4} /> : null}
      {error ? (
        <LoadError
          message={error}
          onRetry={() => {
            setLoading(true);
            load()
              .catch((err) => setError(loadErrorMessage(err, "Impossible de charger les paramètres")))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {profil ? (
        <Enter>
          <Card style={styles.block}>
            <Text style={[styles.kicker, font.medium]}>Profil</Text>
            <View style={styles.avatar}>
              <Text style={[styles.initial, font.bold]}>{profil.prenom.slice(0, 1)}</Text>
            </View>
            <Text style={[styles.name, font.bold]}>
              {profil.prenom} {profil.nom}
            </Text>
            <Text style={[styles.meta, font.regular]}>{profil.role}</Text>
            <Text style={[styles.line, font.regular]}>{profil.email}</Text>
            {profil.telephone ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Appeler ${profil.telephone}`}
                onPress={() => openTel(profil.telephone!)}
              >
                <Text style={[styles.link, font.medium]}>{profil.telephone}</Text>
              </Pressable>
            ) : null}
            <Text nativeID="prenom-label" style={[styles.kicker, font.medium, { marginTop: 12 }]}>
              Prénom
            </Text>
            <TextInput
              accessibilityLabelledBy="prenom-label"
              value={form.prenom}
              onChangeText={(prenom) => setForm((current) => ({ ...current, prenom }))}
              style={styles.input}
            />
            <Text nativeID="nom-label" style={[styles.kicker, font.medium, { marginTop: 8 }]}>
              Nom
            </Text>
            <TextInput
              accessibilityLabelledBy="nom-label"
              value={form.nom}
              onChangeText={(nom) => setForm((current) => ({ ...current, nom }))}
              style={styles.input}
            />
            <Text nativeID="email-label" style={[styles.kicker, font.medium, { marginTop: 8 }]}>
              E-mail
            </Text>
            <TextInput
              accessibilityLabelledBy="email-label"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(email) => setForm((current) => ({ ...current, email }))}
              style={styles.input}
            />
            <Text nativeID="tel-label" style={[styles.kicker, font.medium, { marginTop: 8 }]}>
              Téléphone
            </Text>
            <TextInput
              accessibilityLabelledBy="tel-label"
              keyboardType="phone-pad"
              value={form.telephone}
              onChangeText={(telephone) => setForm((current) => ({ ...current, telephone }))}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enregistrer le profil"
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                setError(null);
                try {
                  await updateCompte({
                    prenom: form.prenom,
                    nom: form.nom,
                    email: form.email,
                    telephone: form.telephone || null,
                  });
                  await load();
                } catch (err) {
                  setError(loadErrorMessage(err, "Impossible d’enregistrer le profil"));
                } finally {
                  setBusy(false);
                }
              }}
              style={({ pressed }) => [styles.save, pressStyle(pressed, reduceMotion)]}
            >
              <Text style={[styles.saveText, font.bold]}>{busy ? "Enregistrement…" : "Enregistrer le profil"}</Text>
            </Pressable>
          </Card>
        </Enter>
      ) : null}

      {compte?.enfants.length ? (
        <Enter index={1}>
          <Card style={styles.block}>
            <Text style={[styles.kicker, font.medium]}>Enfants liés</Text>
            {compte.enfants.length > 2 ? (
              <SearchBar
                inset
                value={query}
                onChangeText={setQuery}
                placeholder="Nom, classe, matricule…"
                accessibilityLabel="Rechercher un enfant"
              />
            ) : null}
            {enfants.map((enfant) => (
              <Pressable
                key={enfant.id}
                accessibilityRole="button"
                accessibilityLabel={`${enfant.prenom} ${enfant.nom}, ${enfant.classe}`}
                onPress={() => selectChild(enfant.id)}
                style={styles.child}
              >
                <View style={styles.childAvatar}>
                  <Text style={[styles.childInitial, font.bold]}>{enfant.prenom.slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.childName, font.semibold]}>
                    {enfant.prenom} {enfant.nom}
                  </Text>
                  <Text style={[styles.meta, font.regular]}>
                    {enfant.classe} · {enfant.relation} · {enfant.matricule}
                  </Text>
                </View>
              </Pressable>
            ))}
            {query.trim() && enfants.length === 0 ? (
              <Text style={[styles.meta, font.regular]}>Aucun enfant ne correspond.</Text>
            ) : null}
          </Card>
        </Enter>
      ) : null}

      {ecole ? (
        <Enter index={2}>
          <Card style={styles.block}>
            <Text style={[styles.kicker, font.medium]}>Établissement</Text>
            <Text style={[styles.name, font.bold]}>{ecole.nom}</Text>
            {ecole.anneeScolaire ? (
              <Text style={[styles.meta, font.regular]}>Année scolaire {ecole.anneeScolaire}</Text>
            ) : null}
            {ecole.adresse ? <Text style={[styles.line, font.regular]}>{ecole.adresse}</Text> : null}
            {ecole.ville ? <Text style={[styles.line, font.regular]}>{ecole.ville}</Text> : null}
            {ecole.telephone ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Appeler l’établissement ${ecole.telephone}`}
                onPress={() => openTel(ecole.telephone)}
              >
                <Text style={[styles.link, font.medium]}>{ecole.telephone}</Text>
              </Pressable>
            ) : null}
            {ecole.email ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Écrire à ${ecole.email}`}
                onPress={() => openMail(ecole.email)}
              >
                <Text style={[styles.link, font.medium]}>{ecole.email}</Text>
              </Pressable>
            ) : null}
          </Card>
        </Enter>
      ) : null}

      <Enter index={3}>
        <Card style={styles.block}>
          <Text style={[styles.kicker, font.medium]}>Mot de passe</Text>
          <TextInput
            accessibilityLabel="Mot de passe actuel"
            secureTextEntry
            value={passwords.currentPassword}
            onChangeText={(currentPassword) => setPasswords((current) => ({ ...current, currentPassword }))}
            placeholder="Mot de passe actuel"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Nouveau mot de passe"
            secureTextEntry
            value={passwords.newPassword}
            onChangeText={(newPassword) => setPasswords((current) => ({ ...current, newPassword }))}
            placeholder="Nouveau mot de passe"
            placeholderTextColor={colors.muted}
            style={[styles.input, { marginTop: 8 }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Modifier le mot de passe"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                await updateComptePassword(passwords.currentPassword, passwords.newPassword);
                setPasswords({ currentPassword: "", newPassword: "" });
              } catch (err) {
                setError(loadErrorMessage(err, "Impossible de modifier le mot de passe"));
              } finally {
                setBusy(false);
              }
            }}
            style={({ pressed }) => [styles.save, pressStyle(pressed, reduceMotion)]}
          >
            <Text style={[styles.saveText, font.bold]}>Modifier le mot de passe</Text>
          </Pressable>
        </Card>
      </Enter>

      <Enter index={4}>
        <Card style={styles.block}>
          <Text style={[styles.kicker, font.medium]}>Authentification à deux facteurs</Text>
          <Text style={[styles.meta, font.regular]}>
            {compte?.profil.twoFactorEnabled ? "A2F activée. Un code sera demandé à la connexion." : "A2F désactivée."}
          </Text>
          {challengeId ? (
            <>
              <TextInput
                accessibilityLabel="Code à 6 chiffres"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
                style={[styles.input, { marginTop: 8, letterSpacing: 6, textAlign: "center" }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirmer l’activation de l’A2F"
                onPress={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await updateCompte2fa({ action: "enable", challengeId, code });
                    setChallengeId(null);
                    setCode("");
                    await load();
                  } catch (err) {
                    setError(loadErrorMessage(err, "Code A2F refusé"));
                  } finally {
                    setBusy(false);
                  }
                }}
                style={({ pressed }) => [styles.save, pressStyle(pressed, reduceMotion)]}
              >
                <Text style={[styles.saveText, font.bold]}>Activer l’A2F</Text>
              </Pressable>
            </>
          ) : compte?.profil.twoFactorEnabled ? (
            <>
              <TextInput
                accessibilityLabel="Mot de passe pour désactiver l’A2F"
                secureTextEntry
                value={disablePassword}
                onChangeText={setDisablePassword}
                placeholder="Mot de passe"
                placeholderTextColor={colors.muted}
                style={[styles.input, { marginTop: 8 }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Désactiver l’A2F"
                onPress={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await updateCompte2fa({ action: "disable", password: disablePassword });
                    setDisablePassword("");
                    await load();
                  } catch (err) {
                    setError(loadErrorMessage(err, "Impossible de désactiver l’A2F"));
                  } finally {
                    setBusy(false);
                  }
                }}
                style={({ pressed }) => [styles.save, pressStyle(pressed, reduceMotion)]}
              >
                <Text style={[styles.saveText, font.bold]}>Désactiver l’A2F</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Activer l’A2F"
              onPress={async () => {
                setBusy(true);
                setError(null);
                try {
                  const res = await updateCompte2fa({ action: "start" });
                  setChallengeId(res.data.challengeId ?? null);
                  setCode("");
                } catch (err) {
                  setError(loadErrorMessage(err, "Impossible d’activer l’A2F"));
                } finally {
                  setBusy(false);
                }
              }}
              style={({ pressed }) => [styles.save, pressStyle(pressed, reduceMotion)]}
            >
              <Text style={[styles.saveText, font.bold]}>Activer l’A2F</Text>
            </Pressable>
          )}
        </Card>
      </Enter>

      <Enter index={5}>
        <NavRow
          icon="notifications-outline"
          title="Notifications"
          subtitle={
            compte && compte.notificationsNonLues > 0
              ? `${compte.notificationsNonLues} non lue${compte.notificationsNonLues > 1 ? "s" : ""}`
              : "Notes, absences et messages"
          }
          onPress={() => router.replace("/(tabs)/plus")}
        />
      </Enter>

      <Enter index={6}>
        <Card>
          <BrandFooter version={version} />
        </Card>
      </Enter>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
        onPress={() => logout()}
        style={({ pressed }) => [styles.out, pressStyle(pressed, reduceMotion)]}
      >
        <Text style={[styles.outText, font.bold]}>Se déconnecter</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  kicker: { fontSize: type.meta, color: colors.muted, marginBottom: 4 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  initial: { fontSize: 22, color: colors.primary },
  name: { fontSize: type.body, color: colors.text },
  meta: { fontSize: type.meta, color: colors.muted },
  line: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 2 },
  link: { fontSize: 15, color: colors.primary, lineHeight: 22, marginTop: 4, minHeight: 22 },
  input: {
    minHeight: 48,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  save: {
    minHeight: 48,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 12,
  },
  saveText: { color: colors.white, fontSize: type.body },
  child: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: hit.min,
    paddingVertical: 8,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  childInitial: { fontSize: 16, color: colors.primary },
  childName: { fontSize: 15, color: colors.text },
  out: {
    minHeight: 52,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    marginTop: 4,
  },
  outText: { color: colors.fail, fontSize: type.body },
});
