import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const authCallbackPath = "auth-callback";

export function getAuthRedirectUrl(): string {
  return Linking.createURL(authCallbackPath);
}

type AuthContextValue = {
  configured: boolean;
  initializing: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readErrorDescription(url: string): string | null {
  const { queryParams } = Linking.parse(url);
  const value = queryParams?.error_description;
  return typeof value === "string" && value ? value : null;
}

function readCode(url: string): string | null {
  const { queryParams } = Linking.parse(url);
  const value = queryParams?.code;
  return typeof value === "string" && value ? value : null;
}

async function completeSignInFromUrl(url: string): Promise<void> {
  const errorDescription = readErrorDescription(url);
  if (errorDescription) throw new Error(errorDescription);

  const code = readCode(url);
  if (!code) return;

  const { error } = await getSupabase().auth.exchangeCodeForSession(code);
  if (error) throw error;
}

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Something went wrong.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setInitializing(false);
      })
      .catch(() => {
        if (active) setInitializing(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setInitializing(false);
      }
    );

    const handleUrl = (url: string) => {
      void completeSignInFromUrl(url).catch((cause: unknown) => {
        setError(toMessage(cause));
      });
    };

    const linking = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      linking.remove();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    const redirectTo = getAuthRedirectUrl();

    // This exact URL must be allowed in Supabase → Authentication → URL
    // Configuration → Redirect URLs, or Supabase falls back to the Site URL.
    console.log(`[auth] OAuth redirect URL: ${redirectTo}`);

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (oauthError) throw oauthError;
    if (!data?.url) throw new Error("Could not start Google sign-in.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log(`[auth] browser result: ${result.type}`);
    if (result.type !== "success") return;

    await completeSignInFromUrl(result.url);
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      initializing,
      session,
      user: session?.user ?? null,
      error,
      clearError,
      signInWithGoogle,
      signOut,
    }),
    [initializing, session, error, clearError, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
