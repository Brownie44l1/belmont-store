import { test } from "node:test";
import assert from "node:assert/strict";

import { getApiBaseUrl, normalizeBaseUrl } from "./config.ts";

test("normalizeBaseUrl rejects missing and blank values", () => {
  assert.equal(normalizeBaseUrl(undefined), null);
  assert.equal(normalizeBaseUrl(""), null);
  assert.equal(normalizeBaseUrl("   "), null);
});

test("normalizeBaseUrl rejects non-URL and non-http values", () => {
  assert.equal(normalizeBaseUrl("not a url"), null);
  assert.equal(normalizeBaseUrl("ftp://example.test"), null);
});

test("normalizeBaseUrl strips trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://example.test/"), "https://example.test");
  assert.equal(
    normalizeBaseUrl("https://example.test/api///"),
    "https://example.test/api"
  );
});

test("normalizeBaseUrl preserves path and origin", () => {
  assert.equal(
    normalizeBaseUrl("  http://10.0.0.5:3000/base  "),
    "http://10.0.0.5:3000/base"
  );
});

test("getApiBaseUrl throws a clear error when unset", () => {
  const original = process.env.EXPO_PUBLIC_API_BASE_URL;
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  try {
    assert.throws(() => getApiBaseUrl(), /EXPO_PUBLIC_API_BASE_URL is missing/);
  } finally {
    process.env.EXPO_PUBLIC_API_BASE_URL = original;
  }
});

test("getApiBaseUrl returns the normalized value when set", () => {
  const original = process.env.EXPO_PUBLIC_API_BASE_URL;
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://example.test/";
  try {
    assert.equal(getApiBaseUrl(), "https://example.test");
  } finally {
    process.env.EXPO_PUBLIC_API_BASE_URL = original;
  }
});
