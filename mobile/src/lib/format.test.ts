import { test } from "node:test";
import assert from "node:assert/strict";

import { formatPrice } from "./format.ts";

test("formatPrice renders NGN without decimals", () => {
  assert.equal(formatPrice(8500000), "₦85,000");
  assert.equal(formatPrice(0), "₦0");
});

test("formatPrice treats input as minor units (kobo)", () => {
  assert.equal(formatPrice(50), "₦1");
  assert.equal(formatPrice(99), "₦1");
});
