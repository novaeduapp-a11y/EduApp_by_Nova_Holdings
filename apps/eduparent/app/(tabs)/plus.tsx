import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Enter } from "@/components/Enter";
import { NavRow } from "@/components/NavRow";
import { PageTitle } from "@/components/PageTitle";
import { Screen } from "@/components/Screen";
import { useSession } from "@/context/session";
import { colors, font, type } from "@/lib/theme";

export default function PlusScreen() {
  const router = useRouter();
  const { user, selected, unreadCount, refresh, photo } = useSession();

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const notifSubtitle =
    unreadCount > 0
      ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
      : "Notes, absences et messages";

  return (
    <Screen>
      <PageTitle title="Autres" switchChild />

      <Enter>
        <Card
          accessibilityLabel="Ouvrir mon profil"
          onPress={() => router.push("/profil" as Href)}
          style={styles.profile}
        >
          <Avatar photo={photo} name={user?.prenom ?? "P"} size={56} />
          <View style={styles.profileCopy}>
            <Text style={[styles.profileName, font.bold]} numberOfLines={1}>
              {user ? `${user.prenom} ${user.nom}` : "Parent"}
            </Text>
            <Text style={[styles.profileSub, font.regular]}>Voir et modifier mon profil</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Card>
      </Enter>

      <Enter index={1}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, font.medium]}>Suivi</Text>
          <NavRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={notifSubtitle}
            badge={unreadCount}
            onPress={() => router.push("/notifications" as Href)}
          />
          <NavRow
            icon="time-outline"
            title="Emploi du temps"
            subtitle={selected ? `Semaine de ${selected.prenom}` : "Semaine de la classe"}
            onPress={() => router.push("/edt")}
          />
          <NavRow
            icon="chatbubble-ellipses-outline"
            title="Messagerie"
            subtitle={selected ? `Professeurs de ${selected.prenom}` : "Professeurs de l’enfant"}
            onPress={() => router.push("/messagerie")}
          />
        </View>
      </Enter>

      <Enter index={2}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, font.medium]}>Compte</Text>
          <NavRow
            icon="settings-outline"
            title="Paramètres"
            subtitle="Sécurité, établissement, application"
            onPress={() => router.push("/parametres")}
          />
        </View>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileCopy: { flex: 1, gap: 2 },
  profileName: { fontSize: 18, color: colors.text },
  profileSub: { fontSize: 14, color: colors.muted },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: type.meta,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
});
