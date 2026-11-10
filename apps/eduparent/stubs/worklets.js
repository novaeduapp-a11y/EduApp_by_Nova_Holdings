/** Stub — Worklets exclu du binaire iOS (crash TestFlight). */
const NOOP = () => undefined;

module.exports = {
  __esModule: true,
  default: {},
  worklets: undefined,
  createSerializable: (v) => v,
  isWorkletFunction: () => false,
  getUIRuntimeHolder: () => null,
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
  scheduleOnUI: NOOP,
  scheduleOnRN: NOOP,
};
