import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/lib/theme";
import { useSession } from "@/context/session";

function TabLabel({ title, focused }: { title: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: focused ? "700" : "500", color: focused ? colors.primary : colors.muted }}>
      {title}
    </Text>
  );
}

export default function TabsLayout() {
  const { unreadCount } = useSession();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarLabel: ({ focused }) => <TabLabel title="Accueil" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarLabel: ({ focused }) => <TabLabel title="Notes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="absences"
        options={{
          title: "Absences",
          tabBarLabel: ({ focused }) => <TabLabel title="Absences" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bulletins"
        options={{
          title: "Bulletins",
          tabBarLabel: ({ focused }) => <TabLabel title="Bulletins" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: "Plus",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary },
          tabBarLabel: ({ focused }) => <TabLabel title="Plus" focused={focused} />,
        }}
      />
      <Tabs.Screen name="edt" options={{ href: null }} />
      <Tabs.Screen name="messagerie" options={{ href: null }} />
    </Tabs>
  );
}
