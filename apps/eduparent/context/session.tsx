import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import {
  fetchCompte,
  fetchEnfants,
  fetchMessagerie,
  fetchNotifications,
  getStoredUser,
  getToken,
  login as apiLogin,
  setToken,
  verifyParent2fa,
  type Enfant,
  type ParentUser,
} from "@/lib/api";
import { registerForPushNotifications, unregisterPushNotifications } from "@/lib/push";

type Session = {
  user: ParentUser | null;
  enfants: Enfant[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<
    | { requires2fa: true; challengeId?: string; debugCode?: string }
    | { requires2fa: false }
    | { requiresPasswordChange: true; userId: string }
  >;
  confirm2fa: (challengeId: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  selectChild: (id: string) => void;
  selected: Enfant | null;
  refresh: () => Promise<void>;
  unreadCount: number;
  messagesUnread: number;
  setMessagesUnread: (n: number) => void;
  photo: string | null;
  setPhoto: (photo: string | null) => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnfants = async () => {
    const [list, notifs, compte] = await Promise.all([
      fetchEnfants(),
      fetchNotifications(),
      fetchCompte().catch(() => null),
    ]);
    setEnfants(list);
    let childId: string | null = null;
    setSelectedId((current) => {
      childId = current && list.some((e) => e.id === current) ? current : list[0]?.id ?? null;
      return childId;
    });
    setUnreadCount(notifs.data.filter((n) => !n.readAt).length);
    if (compte) setPhoto(compte.data.profil.photo ?? null);
    if (childId) {
      try {
        const msg = await fetchMessagerie(childId);
        setMessagesUnread(msg.data.fils.reduce((sum, fil) => sum + (fil.nonLus || 0), 0));
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const stored = await getStoredUser();
        if (stored) setUser(stored);
        await loadEnfants();
        void registerForPushNotifications();
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Recharge badges / enfants + réenregistre le push dès que l’app revient au premier plan.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void getToken().then((token) => {
        if (!token) return;
        loadEnfants().catch(() => undefined);
        void registerForPushNotifications();
      });
    });
    return () => sub.remove();
  }, []);

  const value = useMemo<Session>(
    () => ({
      user,
      enfants,
      selectedId,
      loading,
      error,
      selected: enfants.find((e) => e.id === selectedId) ?? null,
      selectChild: setSelectedId,
      refresh: loadEnfants,
      unreadCount,
      messagesUnread,
      setMessagesUnread,
      photo,
      setPhoto,
      login: async (email, password) => {
        setError(null);
        const result = await apiLogin(email, password);
        if ("requiresPasswordChange" in result && result.requiresPasswordChange) {
          return { requiresPasswordChange: true as const, userId: result.userId };
        }
        if ("requires2fa" in result && result.requires2fa) {
          return {
            requires2fa: true as const,
            challengeId: result.challengeId,
            debugCode: result.debugCode,
          };
        }
        setUser(result.user);
        await loadEnfants();
        void registerForPushNotifications();
        return { requires2fa: false as const };
      },
      confirm2fa: async (challengeId, code) => {
        const nextUser = await verifyParent2fa(challengeId, code);
        setUser(nextUser);
        await loadEnfants();
        void registerForPushNotifications();
      },
      logout: async () => {
        await unregisterPushNotifications();
        await setToken(null);
        setUser(null);
        setEnfants([]);
        setSelectedId(null);
        setUnreadCount(0);
        setMessagesUnread(0);
        setPhoto(null);
      },
    }),
    [user, enfants, selectedId, loading, error, unreadCount, messagesUnread, photo]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession hors provider");
  return ctx;
}
