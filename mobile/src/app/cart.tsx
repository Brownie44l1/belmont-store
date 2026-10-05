import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { checkout } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CartItem, Product } from "@/lib/types";
import { useProducts } from "@/lib/use-products";

function CartRow({
  item,
  product,
  onChangeQuantity,
  onRemove,
}: {
  item: CartItem;
  product: Product | undefined;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <Image
        source={
          product ? { uri: product.imageUrl } : undefined
        }
        style={styles.thumb}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.rowBody}>
        <Text style={styles.name}>{product?.name ?? item.productId}</Text>
        <Text style={styles.unitPrice}>
          {product ? formatPrice(product.priceCents) : "Unavailable"}
        </Text>
        <View style={styles.rowActions}>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              onPress={() => onChangeQuantity(item.quantity - 1)}
              style={styles.stepButton}
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              disabled={item.quantity >= 99}
              onPress={() => onChangeQuantity(item.quantity + 1)}
              style={[
                styles.stepButton,
                item.quantity >= 99 && styles.stepButtonDisabled,
              ]}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${product?.name ?? item.productId}`}
            onPress={onRemove}
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { items, count, loading, error, setQuantity, remove, clear } = useCart();
  const { products } = useProducts();
  const { user, session, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const totalCents = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product ? product.priceCents * item.quantity : 0);
  }, 0);

  function confirmClear() {
    Alert.alert("Clear basket", "Remove all items from your basket?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clear },
    ]);
  }

  async function handleCheckout() {
    if (!user || !session) {
      try {
        await signInWithGoogle();
      } catch (cause) {
        Alert.alert(
          "Sign-in problem",
          cause instanceof Error ? cause.message : "Please try again."
        );
      }
      return;
    }

    setCheckingOut(true);
    try {
      await checkout(items, session.access_token);
      clear();
      router.push("/orders");
    } catch (cause) {
      Alert.alert(
        "Checkout failed",
        cause instanceof Error ? cause.message : "Please try again."
      );
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <CartRow
            item={item}
            product={productMap.get(item.productId)}
            onChangeQuantity={(quantity) => setQuantity(item.productId, quantity)}
            onRemove={() => remove(item.productId)}
          />
        )}
        ListHeaderComponent={
          error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateArea}>
              <ActivityIndicator color="#38bdf8" />
            </View>
          ) : (
            <View style={styles.stateArea}>
              <Text style={styles.stateText}>Your basket is empty.</Text>
            </View>
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total ({count} {count === 1 ? "item" : "items"})
                </Text>
                <Text style={styles.totalValue}>{formatPrice(totalCents)}</Text>
              </View>
              <Text style={styles.footerNote}>
                {user
                  ? "Prices are confirmed on the server when you place the order."
                  : "Sign in with Google to check out and sync your basket across devices."}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={checkingOut}
                onPress={handleCheckout}
                style={[
                  styles.checkoutButton,
                  checkingOut && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.checkoutText}>
                  {checkingOut
                    ? "Placing order…"
                    : user
                    ? "Checkout"
                    : "Sign in to check out"}
                </Text>
              </Pressable>
              <View style={styles.footerActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={confirmClear}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearText}>Clear basket</Text>
                </Pressable>
                {user ? (
                  <Link href="/orders" asChild>
                    <Pressable
                      accessibilityRole="link"
                      style={styles.ordersLink}
                    >
                      <Text style={styles.ordersLinkText}>My orders</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>
            </View>
          ) : null
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
    padding: 16,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#111c30",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#0f172a",
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  unitPrice: {
    color: "#94a3b8",
    fontSize: 14,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 12,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    overflow: "hidden",
  },
  stepButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#0f172a",
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  stepText: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "700",
  },
  quantity: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "center",
  },
  removeText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#7f1d1d",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 14,
  },
  stateArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  stateText: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
  },
  footer: {
    marginTop: 20,
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "#cbd5f5",
    fontSize: 15,
  },
  totalValue: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
  },
  footerNote: {
    color: "#64748b",
    fontSize: 13,
  },
  checkoutButton: {
    backgroundColor: "#38bdf8",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  checkoutText: {
    color: "#0b1120",
    fontSize: 16,
    fontWeight: "700",
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  clearText: {
    color: "#f87171",
    fontSize: 15,
    fontWeight: "600",
  },
  ordersLink: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  ordersLinkText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
  },
});
