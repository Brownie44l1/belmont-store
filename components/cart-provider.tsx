"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type CartEntry = { productId: string; quantity: number };

type CartContextValue = {
  cart: CartEntry[];
  count: number;
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const anonymousCartStorageKey = "belmont-cart-anonymous";
const CartContext = createContext<CartContextValue | null>(null);
const emptyCart: CartEntry[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedCart: CartEntry[] = emptyCart;
let currentUserId: string | null = null;
let pendingWrite = Promise.resolve();
let cartChannel: RealtimeChannel | null = null;
let cartChannelClient: ReturnType<typeof createClient> | null = null;

function getStorageKey(userId = currentUserId) {
  return userId ? `belmont-cart-user:${userId}` : anonymousCartStorageKey;
}

function isCartEntry(value: unknown): value is CartEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as CartEntry;
  return (
    typeof entry.productId === "string" &&
    Number.isInteger(entry.quantity) &&
    entry.quantity > 0 &&
    entry.quantity <= 99
  );
}

function parseCart(raw: string | null): CartEntry[] {
  if (!raw) return emptyCart;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isCartEntry) : emptyCart;
  } catch {
    return emptyCart;
  }
}

function getSnapshot(): CartEntry[] {
  const raw = window.localStorage.getItem(getStorageKey());
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedCart = parseCart(raw);
  }
  return cachedCart;
}

function getServerSnapshot(): CartEntry[] {
  return emptyCart;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeCart(nextCart: CartEntry[], persistToServer = true) {
  const raw = JSON.stringify(nextCart);
  window.localStorage.setItem(getStorageKey(), raw);
  cachedRaw = raw;
  cachedCart = nextCart;
  listeners.forEach((listener) => listener());

  if (currentUserId && persistToServer) {
    const userId = currentUserId;
    pendingWrite = pendingWrite.then(async () => {
      if (currentUserId !== userId) return;
      try {
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: nextCart }),
        });
      } catch {
        // Keep the local copy; the next edit or foreground refresh can retry.
      }
    });
  }
}

function mergeCarts(...carts: CartEntry[][]): CartEntry[] {
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

async function refreshFromServer(userId: string) {
  try {
    const response = await fetch("/api/cart");
    if (!response.ok || currentUserId !== userId) return;
    const serverCart = (await response.json()) as unknown;
    if (!Array.isArray(serverCart)) return;
    writeCart(serverCart.filter(isCartEntry), false);
  } catch {
    // The next Realtime event or foreground refresh will retry.
  }
}

function stopCartSubscription() {
  if (cartChannel && cartChannelClient) {
    void cartChannelClient.removeChannel(cartChannel);
  }
  cartChannel = null;
  cartChannelClient = null;
}

function subscribeToServerCart(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  stopCartSubscription();
  cartChannelClient = supabase;
  cartChannel = supabase
    .channel(`cart-changes-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cart_items",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        void refreshFromServer(userId);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void refreshFromServer(userId);
    });
}

async function activateUser(
  userId: string | null,
  supabase: ReturnType<typeof createClient>
) {
  if (userId === currentUserId) return;

  const anonymousCart = userId && !currentUserId ? getSnapshot() : emptyCart;
  currentUserId = userId;
  cachedRaw = null;
  listeners.forEach((listener) => listener());
  if (!userId) {
    stopCartSubscription();
    return;
  }

  try {
    const response = await fetch("/api/cart");
    if (!response.ok || currentUserId !== userId) return;
    const serverCart = (await response.json()) as CartEntry[];
    const mergedCart = mergeCarts(serverCart, anonymousCart);
    writeCart(mergedCart, false);

    const saveResponse = await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: mergedCart }),
    });
    if (!saveResponse.ok) return;
    window.localStorage.removeItem(anonymousCartStorageKey);
  } catch {
    // The per-user cache remains usable until the API can be reached.
  } finally {
    if (currentUserId === userId) subscribeToServerCart(supabase, userId);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        void activateUser(session?.user.id ?? null, supabase);
      });
    });
    void supabase.auth.getUser().then(({ data: userData }) => {
      void activateUser(userData.user?.id ?? null, supabase);
    });

    function refreshIfSignedIn() {
      if (currentUserId) void refreshFromServer(currentUserId);
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshIfSignedIn();
    }
    window.addEventListener("focus", refreshIfSignedIn);
    window.addEventListener("online", refreshIfSignedIn);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("focus", refreshIfSignedIn);
      window.removeEventListener("online", refreshIfSignedIn);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopCartSubscription();
    };
  }, []);

  function add(productId: string) {
    const nextCart = cart.some((item) => item.productId === productId)
      ? cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...cart, { productId, quantity: 1 }];
    writeCart(nextCart);
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity < 1) return remove(productId);
    writeCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, 99) }
          : item
      )
    );
  }

  function remove(productId: string) {
    writeCart(cart.filter((item) => item.productId !== productId));
  }

  function clear() {
    writeCart([]);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        count: cart.reduce((sum, item) => sum + item.quantity, 0),
        add,
        setQuantity,
        remove,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider.");
  return context;
}
