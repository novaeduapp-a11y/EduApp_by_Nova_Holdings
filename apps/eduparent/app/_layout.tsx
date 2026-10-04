import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "@/context/session";
import { colors } from "@/lib/theme";

function Guard() {
  const { user, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const route = segments[0];
    const onAuth = route === "login" || route === "mot-de-passe-oublie";
    if (!user && !onAuth) router.replace("/login");
    if (user && route === "login") router.replace("/(tabs)");
  }, [user, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "fade" }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="mot-de-passe-oublie" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="conversation" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="bulletin" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="parametres" options={{ animation: "slide_from_right" }} />
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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Guard />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
