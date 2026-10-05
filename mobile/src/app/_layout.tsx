import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0b1120" },
            headerTintColor: "#f8fafc",
            contentStyle: { backgroundColor: "#0b1120" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Belmont Store" }} />
          <Stack.Screen name="cart" options={{ title: "Your basket" }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
