"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function AuthControls() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(!configured);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user.email ?? null);
        setReady(true);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) {
      setBusy(false);
      window.alert("Google sign-in could not be started. Please try again.");
    }
  }

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setBusy(false);
    router.refresh();
  }

  if (!ready) return <span className="auth-placeholder" aria-hidden="true" />;
  if (!configured) {
    return (
      <button
        className="auth-button"
        disabled
        title="Supabase setup is required"
      >
        Sign in
      </button>
    );
  }
  if (email) {
    return (
      <div className="auth-controls">
        <Link
          className="account-link"
          href="/orders"
          aria-label={`Orders for ${email}`}
        >
          My orders
        </Link>
        <button
          className="auth-button"
          disabled={busy}
          onClick={signOut}
          type="button"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <button
      className="auth-button"
      disabled={busy}
      onClick={signIn}
      type="button"
    >
      {busy ? "Opening Google…" : "Sign in"}
    </button>
  );
}
