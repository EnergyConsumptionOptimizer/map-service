import { z } from "zod";

export const CreateFloorPlanSchema = z.object({
  body: z.object({
    svgContent: z.string().nonempty(),
  }),
});
