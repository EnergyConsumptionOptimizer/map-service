import type { Zone } from "@domain/entities/Zone";

export interface ZoneDTO {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly vertices: { x: number; y: number }[];
}

export const zoneDTOMapper = {
  toDTO(zone: Zone): ZoneDTO {
    return {
      id: zone.id.value,
      name: zone.name.value,
      color: zone.color.value,
      vertices: zone.boundary.vertices.map((v) => ({ x: v.x, y: v.y })),
    };
  },
};
