import { z } from "zod";

export const getSmartFurnitureHookupResponse = z.object({
  id: z.string().nonempty(),
});
