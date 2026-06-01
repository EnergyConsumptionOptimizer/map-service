import { z } from "zod";

const zoneId = z.string().nonempty();

const vertexSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const ZoneIdParamSchema = z.object({
  params: z.object({ id: zoneId }),
});

export const CreateZoneSchema = z.object({
  body: z.object({
    name: z.string().nonempty(),
    color: z.string().nonempty(),
    vertices: z.array(vertexSchema).min(3),
  }),
});

export const UpdateZoneSchema = z.object({
  params: z.object({ id: zoneId }),
  body: z
    .object({
      name: z.string().nonempty().optional(),
      color: z.string().nonempty().optional(),
      vertices: z.array(vertexSchema).min(3).optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.color !== undefined ||
        data.vertices !== undefined,
      {
        message:
          "At least one field (name, color, or vertices) must be provided",
      },
    ),
});
