import { Tabs } from "expo-router";
import { colors } from "@/lib/theme";
import { useSession } from "@/context/session";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function TabsLayout() {
  const { unreadCount } = useSession();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="notes" options={{ title: "Notes" }} />
      <Tabs.Screen name="absences" options={{ title: "Absences" }} />
      <Tabs.Screen name="bulletins" options={{ title: "Bulletins" }} />
      <Tabs.Screen
        name="plus"
        options={{
          title: "Plus",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen name="edt" options={{ href: null }} />
      <Tabs.Screen name="messagerie" options={{ href: null }} />
    </Tabs>
  );
}
