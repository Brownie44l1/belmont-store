import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const categoryLabel =
    product.category === "software" ? "DIGITAL" : "HARDWARE";

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.body}>
        <Text style={styles.category}>{categoryLabel}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        <Text style={styles.price}>{formatPrice(product.priceCents)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111c30",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 170,
    backgroundColor: "#0f172a",
  },
  body: {
    padding: 16,
    gap: 6,
  },
  category: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  name: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  price: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
});
