import { z } from "zod";
import rawItemData from "../../../../data/master_items.json";
import rawRelicData from "../../../../data/relic_drops.json";

// --- ITEM DATA SCHEMAS ---

export const zComponentSchema = z.object({
  relics: z.array(z.string()).default([]),
  count: z.number().default(1),
});

export const zItemSchema = z.record(z.string(), zComponentSchema);
export const zMasterItemsSchema = z.record(z.string(), zItemSchema);

// --- RELIC DROPS SCHEMAS ---

// 1. Define the internal structure of a single relic
export const zRelicSchema = z.object({
  common: z.array(z.string()).default([]),
  uncommon: z.array(z.string()).default([]),
  rare: z.array(z.string()).default([]),
});

// 2. Define the master dictionary (Keys: "Axi A1", Values: zRelicSchema)
export const zMasterRelicDropsSchema = z.record(z.string(), zRelicSchema);

// --- TYPES & EXPORTS ---

export type ComponentData = z.infer<typeof zComponentSchema>;
export type ItemData = z.infer<typeof zItemSchema>;
// This replaces your RelicSchema type from types/RelicSchema.ts
export type RelicData = z.infer<typeof zRelicSchema>;

// 3. Parse and export both validated datasets
export const validatedItemData = zMasterItemsSchema.parse(rawItemData);
export const validatedRelicData = zMasterRelicDropsSchema.parse(rawRelicData);
