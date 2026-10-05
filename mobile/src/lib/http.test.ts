import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ApiRequestError,
  extractErrorMessage,
  joinUrl,
  requestJson,
} from "./http.ts";

function withFetch(
  mock: typeof fetch,
  run: () => Promise<void>
): () => Promise<void> {
  return async () => {
    const original = globalThis.fetch;
    globalThis.fetch = mock;
    try {
      await run();
    } finally {
      globalThis.fetch = original;
    }
  };
}

test("joinUrl normalizes the slash between base and path", () => {
  assert.equal(joinUrl("https://api.test", "/api/cart"), "https://api.test/api/cart");
  assert.equal(joinUrl("https://api.test", "api/cart"), "https://api.test/api/cart");
});

test("extractErrorMessage prefers a server error string", () => {
  assert.equal(extractErrorMessage({ error: "Nope." }, 400), "Nope.");
  assert.equal(extractErrorMessage({ error: "   " }, 400), "Request failed with status 400.");
  assert.equal(extractErrorMessage(null, 500), "Request failed with status 500.");
});

test(
  "requestJson sends method, body, and bearer token and parses JSON",
  withFetch(
    (async (url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(String(url), "https://api.test/api/cart");
      assert.equal(init?.method, "PUT");
      const headers = (init?.headers ?? {}) as Record<string, string>;
      assert.equal(headers.Authorization, "Bearer token-123");
      assert.equal(headers["Content-Type"], "application/json");
      assert.equal(init?.body, JSON.stringify({ items: [] }));
      return new Response(JSON.stringify([{ productId: "pos-starter", quantity: 2 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
    async () => {
      const result = await requestJson("https://api.test", "/api/cart", {
        method: "PUT",
        body: { items: [] },
        token: "token-123",
      });
      assert.deepEqual(result, [{ productId: "pos-starter", quantity: 2 }]);
    }
  )
);

test(
  "requestJson surfaces the server error message and status",
  withFetch(
    (async () =>
      new Response(JSON.stringify({ error: "Sign in to access your cart." }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })) as typeof fetch,
    async () => {
      await assert.rejects(
        () => requestJson("https://api.test", "/api/cart"),
        (error: unknown) => {
          assert.ok(error instanceof ApiRequestError);
          assert.equal(error.status, 401);
          assert.equal(error.message, "Sign in to access your cart.");
          return true;
        }
      );
    }
  )
);

test(
  "requestJson uses a generic message when the error body is empty",
  withFetch(
    (async () => new Response(null, { status: 503 })) as typeof fetch,
    async () => {
      await assert.rejects(
        () => requestJson("https://api.test", "/api/cart"),
        (error: unknown) => {
          assert.ok(error instanceof ApiRequestError);
          assert.equal(error.status, 503);
          assert.equal(error.message, "Request failed with status 503.");
          return true;
        }
      );
    }
  )
);

test(
  "requestJson reports network failures with status 0",
  withFetch(
    (async () => {
      throw new TypeError("Network request failed");
    }) as unknown as typeof fetch,
    async () => {
      await assert.rejects(
        () => requestJson("https://api.test", "/api/cart"),
        (error: unknown) => {
          assert.ok(error instanceof ApiRequestError);
          assert.equal(error.status, 0);
          assert.match(error.message, /Could not reach the Belmont server/);
          return true;
        }
      );
    }
  )
);
