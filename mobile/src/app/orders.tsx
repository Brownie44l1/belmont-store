import { Link } from "expo-router";
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

import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import type { OrderRecord } from "@/lib/types";
import { useOrders } from "@/lib/use-orders";

function OrderCard({ order }: { order: OrderRecord }) {
  const placed = new Date(order.created_at).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeading}>
          <Text style={styles.orderRef}>
            ORDER {order.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.orderDate}>{placed}</Text>
        </View>
        <View style={styles.cardTotal}>
          <Text style={styles.status}>{order.status}</Text>
          <Text style={styles.total}>{formatPrice(order.total_cents)}</Text>
        </View>
      </View>
      <View style={styles.items}>
        {order.items.map((item, index) => (
          <View style={styles.itemRow} key={`${order.id}-${index}`}>
            <Text style={styles.itemName}>
              {item.name} × {item.quantity}
            </Text>
            <Text style={styles.itemPrice}>
              {formatPrice(item.unit_price_cents * item.quantity)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { user, signInWithGoogle } = useAuth();
  const { orders, loading, refreshing, error, refresh } = useOrders();

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch (cause) {
      Alert.alert(
        "Sign-in problem",
        cause instanceof Error ? cause.message : "Please try again."
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => <OrderCard order={item} />}
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
          error && orders.length > 0 ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !user ? (
            <View style={styles.stateArea}>
              <Text style={styles.stateText}>
                Sign in with Google to view your order history.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleSignIn}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Sign in</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.stateArea}>
              <ActivityIndicator color="#38bdf8" />
            </View>
          ) : error ? (
            <View style={styles.stateArea}>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={refresh}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateArea}>
              <Text style={styles.stateText}>
                You have not placed an order yet.
              </Text>
              <Link href="/" asChild>
                <Pressable
                  accessibilityRole="link"
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Browse products</Text>
                </Pressable>
              </Link>
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
    padding: 16,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: "#111c30",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeading: {
    flexShrink: 1,
    gap: 2,
  },
  orderRef: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  orderDate: {
    color: "#94a3b8",
    fontSize: 14,
  },
  cardTotal: {
    alignItems: "flex-end",
    gap: 4,
  },
  status: {
    color: "#cbd5f5",
    fontSize: 12,
    textTransform: "capitalize",
  },
  total: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  items: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  itemName: {
    color: "#cbd5f5",
    fontSize: 14,
    flexShrink: 1,
  },
  itemPrice: {
    color: "#e2e8f0",
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
    gap: 16,
    paddingVertical: 64,
  },
  stateText: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#38bdf8",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#0b1120",
    fontSize: 15,
    fontWeight: "700",
  },
});
