/** Stub — Reanimated exclu du binaire iOS (crash TestFlight). */
const NOOP = () => undefined;
const ID = (v) => v;

function makeSharedValue(init) {
  return { value: init, get: () => init, set: NOOP, addListener: NOOP, removeListener: NOOP, modify: NOOP };
}

module.exports = {
  __esModule: true,
  default: {
    call: NOOP,
    createAnimatedComponent: (C) => C,
    View: require("react-native").View,
    Text: require("react-native").Text,
    Image: require("react-native").Image,
    ScrollView: require("react-native").ScrollView,
    FlatList: require("react-native").FlatList,
  },
  useSharedValue: makeSharedValue,
  useAnimatedStyle: () => ({}),
  useAnimatedProps: () => ({}),
  useAnimatedRef: () => ({ current: null }),
  useDerivedValue: (fn) => makeSharedValue(typeof fn === "function" ? fn() : fn),
  useAnimatedScrollHandler: () => NOOP,
  useAnimatedGestureHandler: () => ({}),
  useAnimatedReaction: NOOP,
  useAnimatedSensor: () => ({ sensor: makeSharedValue(0) }),
  useFrameCallback: () => ({ setActive: NOOP }),
  useReducedMotion: () => false,
  withTiming: ID,
  withSpring: ID,
  withDelay: (_d, v) => v,
  withSequence: ID,
  withRepeat: ID,
  cancelAnimation: NOOP,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  createAnimatedComponent: (C) => C,
  Easing: new Proxy(
    {},
    {
      get: () => ID,
    }
  ),
  Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
  interpolate: (_x, _in, out) => (Array.isArray(out) ? out[0] : out),
  interpolateColor: (_x, _in, out) => (Array.isArray(out) ? out[0] : out),
  FadeIn: { duration: () => ({}) },
  FadeOut: { duration: () => ({}) },
  Layout: {},
  LinearTransition: {},
  SlideInRight: {},
  SlideOutLeft: {},
  ZoomIn: {},
  ZoomOut: {},
};
