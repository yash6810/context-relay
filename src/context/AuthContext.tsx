import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  getProjects,
  saveProject,
  getPrimers,
  savePrimer,
  writeToStorage,
  readFromStorage,
} from "../lib/storage";
import {
  pullProjectsFromCloud,
  pullPrimersFromCloud,
  mergeProjects,
  mergePrimers,
} from "../lib/sync";
import { setSyncUser } from "../lib/storage";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const initialSyncDone = useRef(false);

  // ─── Pull remote data and merge with local ─────────────────────────────────
  const pullAndMerge = useCallback(async (currentUser: User) => {
    setSyncing(true);
    try {
      const [localProjects, localPrimers, remoteProjects, remotePrimers] =
        await Promise.all([
          getProjects(),
          getPrimers(),
          pullProjectsFromCloud(currentUser),
          pullPrimersFromCloud(currentUser),
        ]);

      const mergedProjects = mergeProjects(localProjects, remoteProjects);
      const mergedPrimers = mergePrimers(localPrimers, remotePrimers);

      // Write merged data back to local storage
      await writeToStorage("context-relay-projects", mergedProjects);
      await writeToStorage("context-relay-primers", mergedPrimers);

      // Sync local-only data to cloud
      for (const p of mergedProjects) {
        const localExists = localProjects.find((lp) => lp.id === p.id);
        const remoteExists = remoteProjects.find((rp) => rp.id === p.id);
        if (localExists && !remoteExists) {
          await saveProject(p); // triggers sync
        }
      }
    } catch (err) {
      console.error("Sync pull error:", err);
    } finally {
      setSyncing(false);
      initialSyncDone.current = true;
    }
  }, []);

  // ─── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setSyncUser(currentUser);
      setLoading(false);
      if (currentUser && !initialSyncDone.current) {
        pullAndMerge(currentUser);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setSyncUser(currentUser);
      if (currentUser && !initialSyncDone.current) {
        pullAndMerge(currentUser);
      }
    });

    return () => subscription.unsubscribe();
  }, [pullAndMerge]);

  // ─── Auth actions ───────────────────────────────────────────────────────────
  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        syncing,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}