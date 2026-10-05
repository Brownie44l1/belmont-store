import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import type { Order, OrderItem, OrderRecord } from "@/lib/types";

function toMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Could not load your orders.";
}

async function fetchOrders(): Promise<OrderRecord[]> {
  const supabase = getSupabase();
  const { data: orderData, error: ordersError } = await supabase
    .from("orders")
    .select("id,email,total_cents,status,created_at")
    .order("created_at", { ascending: false });
  if (ordersError) throw ordersError;

  const orders = (orderData ?? []) as Order[];
  if (!orders.length) return [];

  const { data: itemData, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id,name,unit_price_cents,quantity")
    .in(
      "order_id",
      orders.map((order) => order.id)
    );
  if (itemsError) throw itemsError;

  const items = (itemData ?? []) as OrderItem[];
  return orders.map((order) => ({
    ...order,
    items: items.filter((item) => item.order_id === order.id),
  }));
}

type OrdersState = {
  orders: OrderRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useOrders(): OrdersState {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchOrders()
      .then((records) => {
        if (!active) return;
        setOrders(records);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active) setError(toMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      setOrders(await fetchOrders());
      setError(null);
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  return {
    orders: user ? orders : [],
    loading: user ? loading : false,
    refreshing,
    error: user ? error : null,
    refresh,
  };
}
