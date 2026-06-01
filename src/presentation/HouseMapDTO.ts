import type { HouseMap } from "@domain/entities/Map";
import {
  floorPlanDTOMapper,
  type FloorPlanDTO,
} from "@presentation/FloorPlanDTO";
import { zoneDTOMapper, type ZoneDTO } from "@presentation/ZoneDTO";
import {
  smartFurnitureHookupDTOMapper,
  type SmartFurnitureHookupDTO,
} from "@presentation/SmartFurnitureHookupDTO";

export interface HouseMapDTO {
  readonly floorPlan: FloorPlanDTO;
  readonly zones: ZoneDTO[];
  readonly smartFurnitureHookups: SmartFurnitureHookupDTO[];
}

export const houseMapDTOMapper = {
  toDTO(houseMap: HouseMap): HouseMapDTO {
    return {
      floorPlan: floorPlanDTOMapper.toDTO(houseMap.floorPlan),
      zones: [...houseMap.zones].map(zoneDTOMapper.toDTO),
      smartFurnitureHookups: [...houseMap.smartFurnitureHookups].map(
        smartFurnitureHookupDTOMapper.toDTO,
      ),
    };
  },
};
