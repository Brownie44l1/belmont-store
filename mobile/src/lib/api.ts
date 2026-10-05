import { getApiBaseUrl } from "./config";
import { requestJson, type HttpOptions } from "./http";
import type { Product } from "./types";

export function apiFetch<T>(
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  return requestJson<T>(getApiBaseUrl(), path, options);
}

export function fetchProducts(options: HttpOptions = {}): Promise<Product[]> {
  return apiFetch<Product[]>("/api/products", options);
}

export { ApiRequestError } from "./http";
export type { HttpOptions } from "./http";
export type { CartItem, Product, ProductCategory } from "./types";
