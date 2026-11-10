import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Fatal = { title: string; message: string; stack?: string };

let latestFatal: Fatal | null = null;
const listeners = new Set<(fatal: Fatal | null) => void>();

function publish(fatal: Fatal | null) {
  latestFatal = fatal;
  listeners.forEach((fn) => fn(fatal));
}

function formatUnknown(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message || String(error), stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

/** Intercepte les fatals JS (sinon iOS abort → « a quitté » sans message). */
export function installFatalHandlers() {
  const g = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
      setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
  };
  const utils = g.ErrorUtils;
  if (!utils?.setGlobalHandler) return;

  const previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    const formatted = formatUnknown(error);
    publish({
      title: isFatal ? "Erreur fatale JS" : "Erreur JS",
      message: formatted.message,
      stack: formatted.stack,
    });
    // Ne pas relayer les fatals : ça provoque SIGABRT / « a quitté » en TestFlight.
    if (!isFatal) previous?.(error, isFatal);
  });
}

class Boundary extends Component<{ children: ReactNode }, { fatal: Fatal | null }> {
  state: { fatal: Fatal | null } = { fatal: null };

  static getDerivedStateFromError(error: Error) {
    return {
      fatal: {
        title: "Erreur de rendu",
        message: error.message || String(error),
        stack: error.stack,
      } satisfies Fatal,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    publish({
      title: "Erreur de rendu",
      message: error.message || String(error),
      stack: [error.stack, info.componentStack].filter(Boolean).join("\n"),
    });
  }

  render() {
    if (this.state.fatal) return <FatalScreen fatal={this.state.fatal} onDismiss={() => this.setState({ fatal: null })} />;
    return this.props.children;
  }
}

function FatalScreen({ fatal, onDismiss }: { fatal: Fatal; onDismiss: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>EduParent — diagnostic</Text>
      <Text style={styles.title}>{fatal.title}</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text selectable style={styles.body}>
          {fatal.message}
        </Text>
        {fatal.stack ? (
          <Text selectable style={styles.stack}>
            {fatal.stack}
          </Text>
        ) : null}
      </ScrollView>
      <Text style={styles.hint}>Fais une capture et envoie-la. Ça remplace le crash « a quitté ».</Text>
      <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.btn}>
        <Text style={styles.btnText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

export function FatalErrorGate({ children }: { children: ReactNode }) {
  const [fatal, setFatal] = useState<Fatal | null>(latestFatal);

  useEffect(() => {
    installFatalHandlers();
    const onFatal = (next: Fatal | null) => setFatal(next);
    listeners.add(onFatal);
    return () => {
      listeners.delete(onFatal);
    };
  }, []);

  return (
    <Boundary>
      {fatal ? <FatalScreen fatal={fatal} onDismiss={() => publish(null)} /> : children}
    </Boundary>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#1A1020", paddingTop: 64, paddingHorizontal: 20, paddingBottom: 28 },
  kicker: { color: "#F7B4C8", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  scroll: { flex: 1, backgroundColor: "#2A1830", borderRadius: 16 },
  scrollContent: { padding: 14 },
  body: { color: "#FFE8EE", fontSize: 15, lineHeight: 22 },
  stack: { color: "#D7B7C2", fontSize: 11, lineHeight: 16, marginTop: 16 },
  hint: { color: "#E7C7D2", fontSize: 13, marginTop: 12, marginBottom: 12 },
  btn: {
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#1A1020", fontSize: 16, fontWeight: "700" },
});
