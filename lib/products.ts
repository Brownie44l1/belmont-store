export type ProductCategory = "software" | "hardware";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  imageUrl: string;
  inStock: boolean;
};

export const products: Product[] = [
  {
    id: "pos-starter",
    name: "Point of Sale Starter",
    description: "A simple sales and receipt system for growing retail teams.",
    category: "software",
    priceCents: 8500000,
    imageUrl:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
  {
    id: "stock-control",
    name: "Stock Control Suite",
    description: "Keep products, stock levels, and purchase records in sync.",
    category: "software",
    priceCents: 12000000,
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
  {
    id: "business-website",
    name: "Business Website Package",
    description:
      "A polished, responsive website designed around your business.",
    category: "software",
    priceCents: 25000000,
    imageUrl:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
  {
    id: "it-support",
    name: "IT Support Plan",
    description:
      "Practical remote support for the technology your team relies on.",
    category: "software",
    priceCents: 6000000,
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
  {
    id: "nvme-ssd-1tb",
    name: "1TB NVMe SSD",
    description:
      "Fast, dependable storage for workstations and compatible laptops.",
    category: "hardware",
    priceCents: 14500000,
    imageUrl:
      "https://images.unsplash.com/photo-1597872200969-2b65d640e7a3?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
  {
    id: "memory-16gb",
    name: "16GB DDR4 Memory",
    description: "A practical memory upgrade for compatible desktop systems.",
    category: "hardware",
    priceCents: 7800000,
    imageUrl:
      "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
  {
    id: "mechanical-keyboard",
    name: "Mechanical Keyboard",
    description: "A sturdy full-size keyboard for focused everyday work.",
    category: "hardware",
    priceCents: 5200000,
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
  {
    id: "dual-band-router",
    name: "Dual-Band Wi-Fi Router",
    description: "Reliable wireless coverage for a home office or small team.",
    category: "hardware",
    priceCents: 6900000,
    imageUrl:
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=85",
    inStock: true,
  },
];

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}
