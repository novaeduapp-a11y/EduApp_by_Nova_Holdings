import { Tabs } from "expo-router";
import { colors } from "@/lib/theme";
import { useSession } from "@/context/session";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function TabsLayout() {
  const { messagesUnread } = useSession();

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
      <Tabs.Screen name="edt" options={{ title: "Emploi" }} />
      <Tabs.Screen
        name="messagerie"
        options={{
          title: "Messages",
          tabBarBadge: messagesUnread > 0 ? messagesUnread : undefined,
        }}
      />
      <Tabs.Screen name="plus" options={{ href: null }} />
      <Tabs.Screen name="notifs" options={{ href: null }} />
      <Tabs.Screen name="absences" options={{ href: null }} />
      <Tabs.Screen name="bulletins" options={{ href: null }} />
    </Tabs>
  );
}
