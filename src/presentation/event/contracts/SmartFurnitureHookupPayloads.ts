import { z } from "zod";

export const smartFurnitureHookupCreatePayloadSchema = z.object({
  smartFurnitureHookupId: z.string(),
});

export const smartFurnitureHookupDeletePayloadSchema = z.object({
  smartFurnitureHookupId: z.string(),
});
