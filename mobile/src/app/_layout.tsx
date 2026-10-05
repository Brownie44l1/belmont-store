import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0b1120" },
          headerTintColor: "#f8fafc",
          contentStyle: { backgroundColor: "#0b1120" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Belmont Store" }} />
      </Stack>
    </>
  );
}
