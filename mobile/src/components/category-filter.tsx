import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CategoryFilter as CategoryFilterValue } from "@/lib/types";

const options: { value: CategoryFilterValue; label: string }[] = [
  { value: "all", label: "All products" },
  { value: "software", label: "Software" },
  { value: "hardware", label: "Hardware" },
];

export function CategoryFilter({
  value,
  onChange,
}: {
  value: CategoryFilterValue;
  onChange: (next: CategoryFilterValue) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "#0f172a",
  },
  chipSelected: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  chipText: {
    color: "#cbd5f5",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#0b1120",
  },
});
