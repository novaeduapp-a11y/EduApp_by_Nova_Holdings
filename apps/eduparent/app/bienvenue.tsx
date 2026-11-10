import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ONBOARDING_IMAGES, type OnboardingImageKind } from "@/lib/onboarding-images";
import { completeOnboarding } from "@/lib/onboarding";
import { colors, font, hit, pressStyle, radius, useReduceMotion } from "@/lib/theme";

const { width, height } = Dimensions.get("window");

type Slide = {
  key: OnboardingImageKind;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    key: "notes",
    title: "Suivez les notes",
    body: "Moyennes, évaluations et bulletins de vos enfants, clairement présentés.",
  },
  {
    key: "temps",
    title: "Absences et emploi du temps",
    body: "Restez informé des absences, retards et du planning de la journée.",
  },
  {
    key: "messages",
    title: "Échangez avec l’école",
    body: "Messagerie avec les professeurs et notifications importantes au même endroit.",
  },
];

function Dot({ active }: { active: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: active ? 22 : 8,
          backgroundColor: active ? colors.white : "rgba(255,255,255,0.45)",
        },
      ]}
    />
  );
}

export default function BienvenueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = useCallback(async () => {
    await completeOnboarding();
    router.replace("/login");
  }, [router]);

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, nextIndex));
      setIndex(clamped);
      listRef.current?.scrollToOffset({
        offset: clamped * width,
        animated: !reduceMotion,
      });
    },
    [reduceMotion]
  );

  const next = () => {
    if (index >= SLIDES.length - 1) {
      void finish();
      return;
    }
    goTo(index + 1);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, height }]} pointerEvents="none">
            <Image source={ONBOARDING_IMAGES[item.key]} style={styles.photo} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(11,47,122,0.15)", "rgba(11,47,122,0.55)", "rgba(11,47,122,0.92)"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.copy, { paddingBottom: Math.max(insets.bottom, 20) + 120 }]}>
              <Text style={[styles.title, font.bold]}>{item.title}</Text>
              <Text style={[styles.body, font.regular]}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Passer l’introduction"
          onPress={() => void finish()}
          hitSlop={8}
          style={({ pressed }) => [styles.skip, pressStyle(pressed, reduceMotion)]}
        >
          <Text style={[styles.skipText, font.semibold]}>Passer</Text>
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.dots} accessibilityRole="tablist" pointerEvents="none">
          {SLIDES.map((s, i) => (
            <View key={s.key} accessibilityRole="tab" accessibilityState={{ selected: i === index }}>
              <Dot active={i === index} />
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={index === SLIDES.length - 1 ? "Commencer" : "Suivant"}
          onPress={next}
          style={({ pressed }) => [styles.cta, pressStyle(pressed, reduceMotion)]}
        >
          <LinearGradient
            colors={[colors.primaryDeep, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaFill}
          >
            <Text style={[styles.ctaText, font.bold]}>
              {index === SLIDES.length - 1 ? "Commencer" : "Suivant"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primaryDeep },
  list: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  slide: { overflow: "hidden" },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  copy: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    gap: 10,
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "flex-end",
    zIndex: 20,
    elevation: 20,
  },
  skip: {
    minHeight: hit.min,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  skipText: { fontSize: 15, color: colors.white },
  title: {
    fontSize: 30,
    color: colors.white,
    textAlign: "left",
    lineHeight: 36,
  },
  body: {
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
    textAlign: "left",
    lineHeight: 26,
    maxWidth: 340,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    gap: 18,
    zIndex: 20,
    elevation: 20,
  },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  cta: { borderRadius: radius.control, overflow: "hidden" },
  ctaFill: {
    minHeight: hit.min + 8,
    borderRadius: radius.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  ctaText: { color: colors.white, fontSize: 17 },
});
