import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";

export default function HomeScreen() {
  const {
    configured,
    initializing,
    user,
    error,
    clearError,
    signInWithGoogle,
    signOut,
  } = useAuth();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>, title: string) {
    setBusy(true);
    clearError();
    try {
      await action();
    } catch (cause) {
      Alert.alert(
        title,
        cause instanceof Error ? cause.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.brand}>Belmont Technologies</Text>
        <Text style={styles.title}>Belmont Store</Text>
        <Text style={styles.subtitle}>
          Software solutions and hardware parts, on the go.
        </Text>

        {error ? (
          <Pressable style={styles.errorBanner} onPress={clearError}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>Tap to dismiss</Text>
          </Pressable>
        ) : null}

        <View style={styles.authArea}>
          {!configured ? (
            <Text style={styles.notice}>
              Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in
              mobile/.env to enable sign-in.
            </Text>
          ) : initializing ? (
            <ActivityIndicator color="#38bdf8" />
          ) : user ? (
            <>
              <Text style={styles.notice}>Signed in as {user.email}</Text>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                disabled={busy}
                onPress={() => run(signOut, "Sign-out problem")}
              >
                <Text style={styles.buttonSecondaryText}>
                  {busy ? "Signing out…" : "Sign out"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              disabled={busy}
              onPress={() => run(signInWithGoogle, "Sign-in problem")}
            >
              <Text style={styles.buttonText}>
                {busy ? "Opening Google…" : "Sign in with Google"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1120",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  brand: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
  },
  authArea: {
    marginTop: 24,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
  },
  notice: {
    color: "#cbd5f5",
    fontSize: 15,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#38bdf8",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#0b1120",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderColor: "#334155",
    borderWidth: 1,
  },
  buttonSecondaryText: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBanner: {
    alignSelf: "stretch",
    backgroundColor: "#7f1d1d",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 14,
  },
  errorHint: {
    color: "#fca5a5",
    fontSize: 12,
  },
});
