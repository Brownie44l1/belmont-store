import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryFilter } from "@/components/category-filter";
import { ProductCard } from "@/components/product-card";
import { useAuth } from "@/lib/auth";
import type { CategoryFilter as CategoryFilterValue } from "@/lib/types";
import { useCart } from "@/lib/use-cart";
import { useProducts } from "@/lib/use-products";

export default function HomeScreen() {
  const {
    configured,
    initializing,
    user,
    error: authError,
    clearError,
    signInWithGoogle,
    signOut,
  } = useAuth();
  const { products, loading, refreshing, error, reload, refresh } =
    useProducts();
  const { items: cartItems } = useCart();
  const [category, setCategory] = useState<CategoryFilterValue>("all");
  const [busy, setBusy] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) => category === "all" || product.category === category
      ),
    [products, category]
  );

  const onAuthPress = useCallback(async () => {
    setBusy(true);
    clearError();
    try {
      if (user) {
        await signOut();
      } else {
        await signInWithGoogle();
      }
    } catch (cause) {
      Alert.alert(
        user ? "Sign-out problem" : "Sign-in problem",
        cause instanceof Error ? cause.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }, [user, signInWithGoogle, signOut, clearError]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#38bdf8"
            colors={["#38bdf8"]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <View style={styles.brandBlock}>
                <Text style={styles.brand}>BELMONT TECHNOLOGIES</Text>
                <Text style={styles.title}>Belmont Store</Text>
              </View>
              {configured ? (
                <Pressable
                  style={[styles.authButton, busy && styles.authButtonDisabled]}
                  disabled={busy || initializing}
                  onPress={onAuthPress}
                >
                  <Text style={styles.authButtonText}>
                    {initializing ? "…" : user ? "Sign out" : "Sign in"}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {!configured ? (
              <Text style={styles.account}>
                Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in
                mobile/.env to enable sign-in.
              </Text>
            ) : user ? (
              <Text style={styles.account}>
                Signed in as {user.email}
                {cartCount > 0 ? `  ·  Basket ${cartCount}` : ""}
              </Text>
            ) : null}

            {authError ? (
              <Pressable style={styles.errorBanner} onPress={clearError}>
                <Text style={styles.errorText}>{authError}</Text>
                <Text style={styles.errorHint}>Tap to dismiss</Text>
              </Pressable>
            ) : null}

            <Text style={styles.subtitle}>
              Software solutions and hardware parts, on the go.
            </Text>

            <CategoryFilter value={category} onChange={setCategory} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateArea}>
              <ActivityIndicator color="#38bdf8" />
              <Text style={styles.stateText}>Loading products…</Text>
            </View>
          ) : error ? (
            <View style={styles.stateArea}>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={reload}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateArea}>
              <Text style={styles.stateText}>
                No products in this category yet.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1120",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 16,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandBlock: {
    flexShrink: 1,
  },
  brand: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
  },
  account: {
    color: "#cbd5f5",
    fontSize: 13,
  },
  authButton: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
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
  stateArea: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 48,
  },
  stateText: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#38bdf8",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: {
    color: "#0b1120",
    fontSize: 15,
    fontWeight: "700",
  },
});
