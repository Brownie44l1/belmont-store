import { NextResponse } from "next/server";
import { products as sampleProducts } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(sampleProducts);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("slug,name,description,category,price_cents,image_url,in_stock")
      .eq("in_stock", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    const catalog = (data ?? []).map((product) => ({
      id: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      priceCents: product.price_cents,
      imageUrl: product.image_url,
      inStock: product.in_stock,
    }));
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Could not load product catalog:", error);
    return NextResponse.json(sampleProducts);
  }
}
