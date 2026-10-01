import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/server/mailgun";

type CheckoutItem = { productId: string; quantity: number };

export async function POST(request: NextRequest) {
  let body: { items?: CheckoutItem[] };
  try {
    body = (await request.json()) as { items?: CheckoutItem[] };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 50
  ) {
    return NextResponse.json(
      { error: "Your basket is empty or too large." },
      { status: 400 }
    );
  }

  const quantities = new Map<string, number>();
  for (const item of body.items) {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !/^[a-z0-9-]+$/.test(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return NextResponse.json(
        { error: "Your basket contains an invalid item." },
        { status: 400 }
      );
    }
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity
    );
  }
  if ([...quantities.values()].some((quantity) => quantity > 99)) {
    return NextResponse.json(
      { error: "Maximum quantity per product is 99." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: "Sign in with Google before placing your order." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const items = [...quantities].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const { data: orderId, error: orderError } = await admin.rpc(
      "create_order",
      {
        p_user_id: user.id,
        p_email: user.email,
        p_items: items,
      }
    );
    if (orderError || typeof orderId !== "string") {
      console.error(
        "Order creation failed:",
        orderError?.message ?? "No order ID returned."
      );
      return NextResponse.json(
        {
          error:
            "The order could not be saved. Check product availability and try again.",
        },
        { status: 400 }
      );
    }

    const [{ data: order }, { data: orderItems }] = await Promise.all([
      admin.from("orders").select("total_cents").eq("id", orderId).single(),
      admin
        .from("order_items")
        .select("name,unit_price_cents,quantity")
        .eq("order_id", orderId),
    ]);
    if (order && orderItems) {
      try {
        await sendOrderConfirmation(
          user.email,
          orderId,
          order.total_cents,
          orderItems
        );
      } catch (emailError) {
        console.error("Order confirmation email failed:", emailError);
      }
    }

    return NextResponse.json({ orderId }, { status: 201 });
  } catch (error) {
    console.error("Checkout setup failed:", error);
    return NextResponse.json(
      { error: "Checkout is not configured yet. Please try again later." },
      { status: 503 }
    );
  }
}
