import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SessionProvider, homeForRole, useSession } from "@/context/session";
import { colors } from "@/lib/theme";

function Guard() {
  const { user, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const first = segments[0];
    const publicScreen = !first || first === "index" || first === "login" || first === "twofa";
    if (!user && !publicScreen) {
      router.replace("/");
      return;
    }
    if (user) {
      const home = homeForRole(user.role);
      const groups = segments as string[];
      const inHome =
        (user.role === "PROFESSEUR" && groups.includes("(prof)")) ||
        (user.role === "PREFET" && groups.includes("(prefet)")) ||
        (user.role === "DIRECTEUR" && groups.includes("(direction)"));
      if (!inHome) router.replace(home);
    }
  }, [user, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="twofa" />
      <Stack.Screen name="(prof)" />
      <Stack.Screen name="(prefet)" />
      <Stack.Screen name="(direction)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Guard />
    </SessionProvider>
  );
}
