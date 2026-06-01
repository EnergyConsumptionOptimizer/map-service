import type { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";

export interface SmartFurnitureHookupDTO {
  readonly id: string;
  readonly position: { x: number; y: number };
  readonly zoneId: string | null;
}

export const smartFurnitureHookupDTOMapper = {
  toDTO(sfh: SmartFurnitureHookup): SmartFurnitureHookupDTO {
    return {
      id: sfh.id.value,
      position: { x: sfh.position.x, y: sfh.position.y },
      zoneId: sfh.zoneId?.value ?? null,
    };
  },
};
