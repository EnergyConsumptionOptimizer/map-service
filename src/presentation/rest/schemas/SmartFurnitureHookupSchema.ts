import { z } from "zod";

const hookupId = z.string().nonempty();

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const SmartFurnitureHookupIdParamSchema = z.object({
  params: z.object({ id: hookupId }),
});

export const UpdateSmartFurnitureHookupSchema = z.object({
  params: z.object({ id: hookupId }),
  body: z
    .object({
      position: positionSchema.optional(),
      zoneId: z.string().nonempty().optional(),
    })
    .refine(
      (data) => data.position !== undefined || data.zoneId !== undefined,
      { message: "At least one field (position or zoneId) must be provided" },
    ),
});
