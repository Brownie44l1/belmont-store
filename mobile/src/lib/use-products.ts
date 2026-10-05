import { useCallback, useEffect, useState } from "react";

import { fetchProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

type ProductsState = {
  products: Product[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
};

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Could not load products.";
}

export function useProducts(): ProductsState {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((catalog) => {
        if (active) setProducts(catalog);
      })
      .catch((cause: unknown) => {
        if (active) setError(toMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then(setProducts)
      .catch((cause: unknown) => setError(toMessage(cause)))
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      setProducts(await fetchProducts());
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { products, loading, refreshing, error, reload, refresh };
}
