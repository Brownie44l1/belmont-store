import { getApiBaseUrl } from "./config";
import { requestJson, type HttpOptions } from "./http";
import type { CartItem, Product } from "./types";

export function apiFetch<T>(
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  return requestJson<T>(getApiBaseUrl(), path, options);
}

export function fetchProducts(options: HttpOptions = {}): Promise<Product[]> {
  return apiFetch<Product[]>("/api/products", options);
}

export function checkout(
  items: CartItem[],
  token: string
): Promise<{ orderId: string }> {
  return apiFetch<{ orderId: string }>("/api/checkout", {
    method: "POST",
    body: { items },
    token,
  });
}

export { ApiRequestError } from "./http";
export type { HttpOptions } from "./http";
export type {
  CartItem,
  Order,
  OrderItem,
  OrderRecord,
  Product,
  ProductCategory,
} from "./types";
