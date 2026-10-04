import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/server/request-user";

type CartItem = { productId: string; quantity: number };

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    /^[a-z0-9-]+$/.test(item.productId) &&
    Number.isInteger(item.quantity) &&
    (item.quantity ?? 0) >= 1 &&
    (item.quantity ?? 100) <= 99
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to access your cart." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cart_items")
      .select("product_slug,quantity")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: true });
    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((item) => ({
        productId: item.product_slug,
        quantity: item.quantity,
      }))
    );
  } catch (error) {
    console.error("Could not load cart:", error);
    return NextResponse.json(
      { error: "Your cart could not be loaded." },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  let body: { items?: unknown };
  try {
    body = (await request.json()) as { items?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.items) || body.items.length > 50) {
    return NextResponse.json(
      { error: "Cart must contain no more than 50 items." },
      { status: 400 }
    );
  }
  if (!body.items.every(isCartItem)) {
    return NextResponse.json(
      { error: "Your cart contains an invalid item." },
      { status: 400 }
    );
  }

  const items = body.items as CartItem[];
  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    return NextResponse.json(
      { error: "Your cart contains a duplicate product." },
      { status: 400 }
    );
  }

  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to update your cart." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.rpc("replace_cart", {
      p_user_id: user.id,
      p_items: items,
    });
    if (error) {
      if (/unknown cart product/i.test(error.message)) {
        return NextResponse.json(
          { error: "Your cart contains an unavailable product." },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Could not update cart:", error);
    return NextResponse.json(
      { error: "Your cart could not be updated." },
      { status: 503 }
    );
  }
}
