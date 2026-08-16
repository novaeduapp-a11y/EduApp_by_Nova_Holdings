import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchEnfants, fetchNotifications, getStoredUser, getToken, login as apiLogin, setToken, type Enfant, type ParentUser } from "@/lib/api";

type Session = {
  user: ParentUser | null;
  enfants: Enfant[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectChild: (id: string) => void;
  selected: Enfant | null;
  refresh: () => Promise<void>;
  unreadCount: number;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnfants = async () => {
    const list = await fetchEnfants();
    setEnfants(list);
    setSelectedId((current) => current ?? list[0]?.id ?? null);
    const notifs = await fetchNotifications();
    setUnreadCount(notifs.data.filter((n) => !n.readAt).length);
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
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
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
      login: async (email, password) => {
        setError(null);
        const nextUser = await apiLogin(email, password);
        setUser(nextUser);
        await loadEnfants();
      },
      logout: async () => {
        await setToken(null);
        setUser(null);
        setEnfants([]);
        setSelectedId(null);
        setUnreadCount(0);
      },
    }),
    [user, enfants, selectedId, loading, error, unreadCount]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession hors provider");
  return ctx;
}
