import { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, space } from "@/lib/theme";

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  contentStyle,
  hero,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  hero?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const bodyPad = {
    paddingTop: hero ? 16 : insets.top + 8,
    paddingHorizontal: space.screen,
    paddingBottom: 96,
    gap: space.section,
  };

  if (!scroll) {
    return (
      <View style={[styles.screen, { flex: 1 }]}>
        {hero ? <StatusBar style="light" /> : <StatusBar style="dark" />}
        {hero}
        <View style={[styles.content, bodyPad, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {hero ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      {hero}
      <View style={[styles.content, bodyPad, contentStyle]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  content: { flexGrow: 1 },
});
