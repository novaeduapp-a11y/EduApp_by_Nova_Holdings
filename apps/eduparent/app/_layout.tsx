import "react-native-gesture-handler";
import { Stack, useRouter, useSegments, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FatalErrorGate, installFatalHandlers } from "@/components/FatalErrorGate";
import { PushBootstrap } from "@/components/PushBootstrap";
import { TermsGate } from "@/components/TermsGate";
import { WelcomeMoment } from "@/components/WelcomeMoment";
import { SessionProvider, useSession } from "@/context/session";
import { readOnboardingDone } from "@/lib/onboarding";
import { colors } from "@/lib/theme";

installFatalHandlers();

const BIENVENUE = "/bienvenue" as Href;
const LOGIN = "/login" as Href;
const TABS = "/(tabs)" as Href;
const APP_VERSION = "1.0.16";

function Guard() {
  const { user, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const route = String(segments[0] ?? "");

  // Relecture à chaque changement de route : sinon « Passer / Commencer »
  // écrit le flag mais l’état React reste faux → rebond permanent sur /bienvenue.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const done = await readOnboardingDone();
        if (!alive) return;
        setOnboardingDone(done);
      } catch {
        if (!alive) return;
        setOnboardingDone(true);
      } finally {
        if (alive) setOnboardingReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [route]);

  useEffect(() => {
    if (loading || !onboardingReady) return;
    const onAuth =
      route === "login" ||
      route === "mot-de-passe-oublie" ||
      route === "changer-mot-de-passe" ||
      route === "bienvenue";

    if (!user) {
      if (!onboardingDone && route !== "bienvenue") {
        router.replace(BIENVENUE);
        return;
      }
      if (onboardingDone && route === "bienvenue") {
        router.replace(LOGIN);
        return;
      }
      if (onboardingDone && !onAuth) {
        router.replace(LOGIN);
      }
      return;
    }

    if (route === "login" || route === "changer-mot-de-passe" || route === "bienvenue") {
      router.replace(TABS);
    }
  }, [user, loading, onboardingReady, onboardingDone, route, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "fade" }}>
      <Stack.Screen name="bienvenue" />
      <Stack.Screen name="login" />
      <Stack.Screen name="mot-de-passe-oublie" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="changer-mot-de-passe" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="conversation" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="bulletin" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="convocation" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="communique" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="matiere" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="parametres" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profil" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!loaded) {
    return (
      <View style={styles.boot}>
        <StatusBar style="dark" />
        <Text style={styles.bootTitle}>EduParent</Text>
        <Text style={styles.bootMeta}>{APP_VERSION}</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <FatalErrorGate>
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style="dark" />
          <PushBootstrap />
          <TermsGate />
          <Guard />
          {/* Splash photo plein écran façon Bag'up (démarrage + retour app). */}
          <WelcomeMoment />
        </SessionProvider>
      </SafeAreaProvider>
    </FatalErrorGate>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  bootTitle: { fontSize: 28, fontWeight: "700", color: colors.primaryDeep },
  bootMeta: { marginTop: 6, fontSize: 14, fontWeight: "500", color: colors.muted },
});
