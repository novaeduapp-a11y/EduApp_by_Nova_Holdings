import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchMe,
  getStoredUser,
  getToken,
  loginStaff,
  setSession,
  verify2fa,
  type Portail,
  type StaffUser,
} from "@/lib/api";

type Session = {
  user: StaffUser | null;
  loading: boolean;
  login: (email: string, password: string, portail: Portail) => Promise<{ requires2fa: boolean; challengeId?: string; debugCode?: string }>;
  confirm2fa: (challengeId: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const stored = await getStoredUser();
        if (stored) setUser(stored);
        const me = await fetchMe();
        setUser(me.data);
        await setSession(token, me.data);
      } catch {
        await setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<Session>(
    () => ({
      user,
      loading,
      login: async (email, password, portail) => {
        const res = await loginStaff(email, password, portail);
        if (res.data.requires2fa) {
          return { requires2fa: true, challengeId: res.data.challengeId, debugCode: res.data.debugCode };
        }
        await setSession(res.data.token, res.data.user);
        setUser(res.data.user);
        return { requires2fa: false };
      },
      confirm2fa: async (challengeId, code) => {
        const res = await verify2fa(challengeId, code);
        await setSession(res.data.token, res.data.user);
        setUser(res.data.user);
      },
      logout: async () => {
        await setSession(null);
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession hors provider");
  return ctx;
}

export function homeForRole(role: StaffUser["role"]) {
  if (role === "PREFET") return "/(prefet)";
  if (role === "DIRECTEUR") return "/(direction)";
  return "/(prof)";
}
