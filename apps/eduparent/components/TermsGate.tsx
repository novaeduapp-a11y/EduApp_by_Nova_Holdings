import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { acceptTerms, fetchCompte } from "@/lib/api";
import { LEGAL_URLS } from "@/lib/contact";
import { useSession } from "@/context/session";
import { colors, font } from "@/lib/theme";

export function TermsGate() {
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setOpen(false);
      return;
    }
    let alive = true;
    fetchCompte()
      .then((res) => {
        if (alive) setOpen(res.data.profil.termsAccepted === false);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [user]);

  if (!open) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, font.bold]}>Conditions et confidentialité</Text>
          <Text style={[styles.body, font.regular]}>
            En vous connectant, vous acceptez les{" "}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(LEGAL_URLS.conditions).catch(() => undefined)}
            >
              Conditions d’utilisation
            </Text>{" "}
            et la{" "}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(LEGAL_URLS.confidentialite).catch(() => undefined)}
            >
              Politique de confidentialité
            </Text>
            .
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await acceptTerms();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
            style={styles.primary}
          >
            <Text style={[styles.primaryText, font.bold]}>{busy ? "Enregistrement…" : "J’accepte"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => logout()} style={styles.ghost}>
            <Text style={[styles.ghostText, font.semibold]}>Refuser et quitter</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    maxHeight: "80%",
    borderRadius: 24,
    backgroundColor: colors.white,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 20, color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.muted },
  link: { color: colors.primary, textDecorationLine: "underline" },
  primary: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryText: { color: "#fff", fontSize: 16 },
  ghost: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  ghostText: { color: colors.fail, fontSize: 15 },
});
