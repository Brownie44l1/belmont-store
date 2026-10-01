"use client";

import { useSearchParams } from "next/navigation";

export function OrderPlacedNotice() {
  const searchParams = useSearchParams();
  if (!searchParams.has("placed")) return null;

  return (
    <p aria-live="polite" className="order-placed-notice">
      Your order has been placed. A confirmation email will follow if email
      delivery is configured.
    </p>
  );
}
