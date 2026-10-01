"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthControls } from "@/components/auth-controls";
import { useCart } from "@/components/cart-provider";
import { formatPrice, products as sampleProducts } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const { cart, clear, remove, setQuantity } = useCart();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState(sampleProducts);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) return;
        const catalog = (await response.json()) as typeof sampleProducts;
        if (Array.isArray(catalog)) setProducts(catalog);
      })
      .catch(() => undefined);
  }, []);

  const items = cart.flatMap((entry) => {
    const product = products.find((item) => item.id === entry.productId);
    return product ? [{ ...entry, product }] : [];
  });
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0
  );

  async function checkout() {
    setBusy(true);
    setMessage("");
    try {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        setMessage(
          "Sign-in is not configured yet. Set up Supabase to place orders."
        );
        setBusy(false);
        return;
      }
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/cart`,
          },
        });
        if (error) throw error;
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const result = (await response.json()) as {
        orderId?: string;
        error?: string;
      };
      if (!response.ok || !result.orderId)
        throw new Error(result.error ?? "Checkout could not be completed.");
      clear();
      router.push(`/orders?placed=${encodeURIComponent(result.orderId)}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Checkout could not be completed."
      );
      setBusy(false);
    }
  }

  return (
    <main className="storefront subpage">
      <header className="site-header">
        <Link
          aria-label="Belmont Technologies home"
          className="brand"
          href="/"
        >
          <span className="brand-mark">B</span>
          <span>
            belmont<span className="brand-light">tech</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="main-nav">
          <Link href="/">Continue shopping</Link>
        </nav>
        <AuthControls />
      </header>
      <section className="subpage-content">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> YOUR SELECTION
        </p>
        <div className="catalogue-heading cart-heading">
          <h1>Your basket</h1>
          <p className="result-count">
            {items.length.toString().padStart(2, "0")} ITEMS
          </p>
        </div>
        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Your basket is empty.</p>
            <Link className="text-link" href="/">
              Browse the collection <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map(({ product, quantity }) => (
                <article className="cart-item" key={product.id}>
                  <div
                    aria-label={product.name}
                    className="cart-item-image"
                    role="img"
                    style={{ backgroundImage: `url("${product.imageUrl}")` }}
                  />
                  <div className="cart-item-details">
                    <span className="product-category-label">
                      {product.category === "software"
                        ? "SOFTWARE"
                        : "HARDWARE"}
                    </span>
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                    <button
                      className="remove-button"
                      onClick={() => remove(product.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="cart-item-end">
                    <span className="product-price">
                      {formatPrice(product.priceCents * quantity)}
                    </span>
                    <label className="quantity-control">
                      Qty
                      <input
                        max={99}
                        min={1}
                        onChange={(event) => {
                          const value = event.currentTarget.valueAsNumber;
                          if (Number.isInteger(value) && value >= 1)
                            setQuantity(product.id, value);
                        }}
                        type="number"
                        value={quantity}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
            <aside className="order-summary">
              <h2>Order summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>Arranged after order</span>
              </div>
              <p className="summary-note">
                Software delivery and hardware collection will be arranged with
                you after your order is confirmed.
              </p>
              {message && (
                <p aria-live="polite" className="form-message">
                  {message}
                </p>
              )}
              <button
                className="checkout-button"
                disabled={busy}
                onClick={checkout}
                type="button"
              >
                {busy ? "Processing…" : "Place order"}
                <span aria-hidden="true">↗</span>
              </button>
              <Link className="continue-link" href="/">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
