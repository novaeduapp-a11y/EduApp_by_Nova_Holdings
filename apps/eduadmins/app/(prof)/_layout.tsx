import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/lib/theme";

function TabLabel({ title, focused }: { title: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: focused ? "700" : "500", color: focused ? colors.primary : colors.muted }}>
      {title}
    </Text>
  );
}

export default function ProfTabs() {
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
        options={{ title: "Accueil", tabBarLabel: ({ focused }) => <TabLabel title="Accueil" focused={focused} /> }}
      />
      <Tabs.Screen
        name="classes"
        options={{ title: "Classes", tabBarLabel: ({ focused }) => <TabLabel title="Classes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: "Notes", tabBarLabel: ({ focused }) => <TabLabel title="Notes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="appel"
        options={{ title: "Appel", tabBarLabel: ({ focused }) => <TabLabel title="Appel" focused={focused} /> }}
      />
      <Tabs.Screen
        name="plus"
        options={{ title: "Plus", tabBarLabel: ({ focused }) => <TabLabel title="Plus" focused={focused} /> }}
      />
      <Tabs.Screen name="evaluation/[id]" options={{ href: null }} />
      <Tabs.Screen name="classe/[id]" options={{ href: null }} />
    </Tabs>
  );
}
