import { FloorPlan } from "@domain/values/FloorPlan";
import { Zone } from "@domain/entities/Zone";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { HouseMap } from "@domain/entities/Map";
import {
  validFloorPlan,
  aZone,
  aSmartFurnitureHookup,
  point,
  validZoneID,
} from "@test/domainFactories";

// ─── Floor plan ───────────────────────────────────────────────────────────────

export const mockFloorPlan: FloorPlan = validFloorPlan(
  "<svg><rect width='500' height='400'/></svg>",
);

// ─── Zones ───────────────────────────────────────────────────────────────────

export const mockLivingRoom: Zone = aZone({
  id: "zone-living-room",
  name: "Living Room",
  color: "#FF8800",
});

export const mockKitchen: Zone = aZone({
  id: "zone-kitchen",
  name: "Kitchen",
  color: "#00AA44",
});

export const mockBedroom: Zone = aZone({
  id: "zone-bedroom",
  name: "Bedroom",
  color: "#4466FF",
});

// ─── Smart furniture hookups ─────────────────────────────────────────────────

export const mockHookupDesk: SmartFurnitureHookup = aSmartFurnitureHookup({
  id: "sfh-desk",
  position: point(3, 4),
  zoneId: validZoneID("zone-living-room"),
});

export const mockHookupLamp: SmartFurnitureHookup = aSmartFurnitureHookup({
  id: "sfh-lamp",
  position: point(7, 2),
  zoneId: null,
});

export const mockHookupFridge: SmartFurnitureHookup = aSmartFurnitureHookup({
  id: "sfh-fridge",
  position: point(1, 9),
  zoneId: validZoneID("zone-kitchen"),
});

// ─── House map ────────────────────────────────────────────────────────────────

export const mockHouseMap: HouseMap = HouseMap.rehydrate(
  mockFloorPlan,
  [mockLivingRoom, mockKitchen],
  [mockHookupDesk, mockHookupLamp],
);
