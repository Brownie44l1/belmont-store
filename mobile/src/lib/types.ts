export type ProductCategory = "software" | "hardware";

export type CategoryFilter = "all" | ProductCategory;

export type Product = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  imageUrl: string;
  inStock: boolean;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  email: string;
  total_cents: number;
  status: string;
  created_at: string;
};

export type OrderItem = {
  order_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
};

export type OrderRecord = Order & {
  items: OrderItem[];
};
