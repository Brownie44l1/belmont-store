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
