import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import type { CartItem } from "@/lib/types";

const anonymousCartStorageKey = "belmont-cart-anonymous";

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as CartItem;
  return (
    typeof item.productId === "string" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= 99
  );
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

function mergeCarts(...carts: CartItem[][]): CartItem[] {
  const quantities = new Map<string, number>();
  for (const cart of carts) {
    for (const item of cart) {
      quantities.set(
        item.productId,
        Math.min(99, (quantities.get(item.productId) ?? 0) + item.quantity)
      );
    }
  }
  return [...quantities].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Could not update your cart.";
}

function capQuantity(quantity: number): number {
  return Math.max(1, Math.min(99, quantity));
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  loading: boolean;
  error: string | null;
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    async (next: CartItem[]) => {
      setItems(next);
      if (!token) {
        try {
          await AsyncStorage.setItem(
            anonymousCartStorageKey,
            JSON.stringify(next)
          );
        } catch {
          // Keep the in-memory cart; the next edit retries.
        }
        return;
      }
      try {
        await apiFetch<CartItem[]>("/api/cart", {
          method: "PUT",
          body: { items: next },
          token,
        });
        setError(null);
      } catch (cause) {
        setError(toMessage(cause));
      }
    },
    [token]
  );

  useEffect(() => {
    let active = true;

    if (!user || !token) {
      AsyncStorage.getItem(anonymousCartStorageKey)
        .then((raw) => {
          if (!active) return;
          setItems(parseCart(raw));
          setLoading(false);
        })
        .catch(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }

    Promise.all([
      apiFetch<CartItem[]>("/api/cart", { token }),
      AsyncStorage.getItem(anonymousCartStorageKey),
    ])
      .then(async ([serverCart, rawAnonymous]) => {
        if (!active) return;
        const merged = mergeCarts(serverCart, parseCart(rawAnonymous));
        setItems(merged);
        setError(null);
        await apiFetch<CartItem[]>("/api/cart", {
          method: "PUT",
          body: { items: merged },
          token,
        });
        if (rawAnonymous) {
          await AsyncStorage.removeItem(anonymousCartStorageKey);
        }
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
    if (!user || !token) return;
    const supabase = getSupabase();
    const refetch = () => {
      apiFetch<CartItem[]>("/api/cart", { token })
        .then((serverCart) => {
          setItems(serverCart);
          setError(null);
        })
        .catch(() => undefined);
    };
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
        refetch
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refetch();
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      apiFetch<CartItem[]>("/api/cart", { token })
        .then(setItems)
        .catch(() => undefined);
    });
    return () => subscription.remove();
  }, [user, token]);

  const add = useCallback(
    (productId: string) => {
      const existing = items.find((item) => item.productId === productId);
      const next = existing
        ? items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: capQuantity(item.quantity + 1) }
              : item
          )
        : [...items, { productId, quantity: 1 }];
      void persist(next);
    },
    [items, persist]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        void persist(items.filter((item) => item.productId !== productId));
        return;
      }
      void persist(
        items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: capQuantity(quantity) }
            : item
        )
      );
    },
    [items, persist]
  );

  const remove = useCallback(
    (productId: string) => {
      void persist(items.filter((item) => item.productId !== productId));
    },
    [items, persist]
  );

  const clear = useCallback(() => {
    void persist([]);
  }, [persist]);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems(parseCart(await AsyncStorage.getItem(anonymousCartStorageKey)));
      return;
    }
    try {
      setItems(await apiFetch<CartItem[]>("/api/cart", { token }));
      setError(null);
    } catch (cause) {
      setError(toMessage(cause));
    }
  }, [token]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      loading,
      error,
      add,
      setQuantity,
      remove,
      clear,
      refresh,
    }),
    [items, loading, error, add, setQuantity, remove, clear, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider.");
  return context;
}
