import { Suspense } from "react";
import Link from "next/link";
import { AuthControls } from "@/components/auth-controls";
import { OrderPlacedNotice } from "@/components/order-placed-notice";
import { formatPrice } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

type Order = {
  id: string;
  email: string;
  total_cents: number;
  status: string;
  created_at: string;
};

type OrderItem = {
  order_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
};

export default async function OrdersPage() {
  let signedIn = false;
  let orders: Order[] = [];
  let items: OrderItem[] = [];
  let unavailable = false;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    unavailable = true;
  } else {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        signedIn = true;
        const { data: orderData, error: ordersError } = await supabase
          .from("orders")
          .select("id,email,total_cents,status,created_at")
          .order("created_at", { ascending: false });
        if (ordersError) throw ordersError;
        orders = (orderData ?? []) as Order[];
        if (orders.length) {
          const { data: itemData, error: itemsError } = await supabase
            .from("order_items")
            .select("order_id,name,unit_price_cents,quantity")
            .in(
              "order_id",
              orders.map((order) => order.id)
            );
          if (itemsError) throw itemsError;
          items = (itemData ?? []) as OrderItem[];
        }
      }
    } catch (error) {
      console.error("Could not load order history:", error);
      unavailable = true;
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
          <span className="eyebrow-dot" /> ACCOUNT
        </p>
        <div className="catalogue-heading cart-heading">
          <h1>My orders</h1>
        </div>
        <Suspense fallback={null}>
          <OrderPlacedNotice />
        </Suspense>
        {unavailable ? (
          <p className="orders-message">
            Order history is unavailable. Complete the Supabase setup to access
            saved orders.
          </p>
        ) : !signedIn ? (
          <div className="empty-cart">
            <p>Sign in with Google to view your order history.</p>
            <AuthControls />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-cart">
            <p>You have not placed an order yet.</p>
            <Link className="text-link" href="/">
              Browse the collection <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-record" key={order.id}>
                <div className="order-record-heading">
                  <div>
                    <span className="product-category-label">
                      ORDER {order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p>
                      {new Date(order.created_at).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="order-record-total">
                    <span className={`status-label status-${order.status}`}>
                      {order.status}
                    </span>
                    <strong>{formatPrice(order.total_cents)}</strong>
                  </div>
                </div>
                <ul className="order-record-items">
                  {items
                    .filter((item) => item.order_id === order.id)
                    .map((item, index) => (
                      <li key={`${order.id}-${index}`}>
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>
                          {formatPrice(item.unit_price_cents * item.quantity)}
                        </span>
                      </li>
                    ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
