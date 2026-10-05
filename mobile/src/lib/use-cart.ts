import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Could not load your cart.";
}

export function useCart(): CartState {
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems(await apiFetch<CartItem[]>("/api/cart", { token }));
      setError(null);
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user || !token) return;
    let active = true;
    apiFetch<CartItem[]>("/api/cart", { token })
      .then((serverCart) => {
        if (!active) return;
        setItems(serverCart);
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
  }, [user, token]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`cart-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void load();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void load();
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  useEffect(() => {
    if (!user) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
    });
    return () => subscription.remove();
  }, [user, load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return {
    items: user ? items : [],
    loading: user ? loading : false,
    refreshing,
    error: user ? error : null,
    refresh,
  };
}
