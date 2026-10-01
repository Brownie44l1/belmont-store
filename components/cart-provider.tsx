"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartEntry = { productId: string; quantity: number };

type CartContextValue = {
  cart: CartEntry[];
  count: number;
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const cartStorageKey = "belmont-cart";
const CartContext = createContext<CartContextValue | null>(null);
const emptyCart: CartEntry[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedCart: CartEntry[] = emptyCart;

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
  const raw = window.localStorage.getItem(cartStorageKey);
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

function writeCart(nextCart: CartEntry[]) {
  const raw = JSON.stringify(nextCart);
  window.localStorage.setItem(cartStorageKey, raw);
  cachedRaw = raw;
  cachedCart = nextCart;
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
