import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ONBOARDING_IMAGES,
  ONBOARDING_IMAGE_KINDS,
  type OnboardingImageKind,
} from "@/lib/onboarding-images";
import { colors, fonts } from "@/lib/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const DURATION_MS = 2800;

/**
 * Splash façon Bag'up : photo plein écran aléatoire + logo centré + fade.
 * Au démarrage et au retour depuis l’arrière-plan.
 */
export function WelcomeMoment({
  onFinish,
}: {
  onFinish?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);
  const [kind, setKind] = useState<OnboardingImageKind>(
    () => ONBOARDING_IMAGE_KINDS[Math.floor(Math.random() * ONBOARDING_IMAGE_KINDS.length)] ?? "notes"
  );
  const scene = useMemo(() => ONBOARDING_IMAGES[kind], [kind]);

  const bgOpacity = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    setVisible(false);
    onFinish?.();
  }, [onFinish]);

  const play = useCallback(
    (nextKind?: OnboardingImageKind) => {
      const chosen =
        nextKind ??
        ONBOARDING_IMAGE_KINDS[Math.floor(Math.random() * ONBOARDING_IMAGE_KINDS.length)] ??
        "notes";
      setKind(chosen);
      setVisible(true);

      bgOpacity.setValue(0);
      bgScale.setValue(1);
      logoOpacity.setValue(0);
      logoScale.setValue(0.86);
      textOpacity.setValue(0);
      screenOpacity.setValue(1);

      if (hideTimer.current) clearTimeout(hideTimer.current);

      Animated.parallel([
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(bgScale, {
          toValue: 1.06,
          duration: DURATION_MS,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.sequence([
          Animated.delay(180),
          Animated.parallel([
            Animated.timing(logoOpacity, {
              toValue: 1,
              duration: 520,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease),
            }),
            Animated.spring(logoScale, {
              toValue: 1,
              useNativeDriver: true,
              friction: 7,
              tension: 70,
            }),
          ]),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]),
      ]).start();

      hideTimer.current = setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }).start(({ finished }) => {
          if (finished) finish();
        });
      }, DURATION_MS);
    },
    [bgOpacity, bgScale, finish, logoOpacity, logoScale, screenOpacity, textOpacity]
  );

  useEffect(() => {
    play(kind);
    const sub = AppState.addEventListener("change", (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        play();
      }
      appState.current = next;
    });
    return () => {
      sub.remove();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity, width: SCREEN_W, height: SCREEN_H }]}>
      <StatusBar style="light" />
      <Animated.View style={[styles.bgWrap, { opacity: bgOpacity, transform: [{ scale: bgScale }] }]}>
        <Image source={scene} style={styles.bgImage} resizeMode="cover" />
      </Animated.View>

      <LinearGradient
        colors={["rgba(11,47,122,0.28)", "rgba(11,47,122,0.58)", "rgba(11,47,122,0.88)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            alignItems: "center",
          }}
        >
          <Image source={require("@/assets/icon.png")} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={{ opacity: textOpacity, alignItems: "center", marginTop: 20 }}>
          <Text style={styles.title}>EduParent</Text>
          <Text style={styles.subtitle}>Le suivi scolaire des familles</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.primaryDeep,
  },
  bgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImage: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logo: {
    width: 128,
    height: 128,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.white,
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.white,
    opacity: 0.95,
    marginTop: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
