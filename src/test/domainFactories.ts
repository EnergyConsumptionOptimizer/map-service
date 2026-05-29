import { ZoneID } from "@domain/values/ZoneID";
import { ZoneName } from "@domain/values/ZoneName";
import { Color } from "@domain/values/Color";
import { Point } from "@domain/values/Point";
import { Polygon } from "@domain/values/Polygon";
import { FloorPlan } from "@domain/values/FloorPlan";
import { HouseMapID } from "@domain/values/HouseMapID";
import { SmartFurnitureHookupID } from "@domain/values/SmartFurnitureHookupID";
import { Zone } from "@domain/entities/Zone";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { HouseMap } from "@domain/entities/Map";

export function validZoneID(value = "zone-1"): ZoneID {
  return ZoneID.from(value) as ZoneID;
}

export function validHookupID(value = "sfh-1"): SmartFurnitureHookupID {
  return SmartFurnitureHookupID.from(value) as SmartFurnitureHookupID;
}

export function validHouseMapID(): HouseMapID {
  return HouseMapID;
}

export function validZoneName(value = "Living Room"): ZoneName {
  return ZoneName.from(value) as ZoneName;
}

export function validColor(value = "#FF8800"): Color {
  return Color.from(value) as Color;
}

export function point(x: number, y: number): Point {
  return Point.from(x, y) as Point;
}

export function validFloorPlan(value = "<svg></svg>"): FloorPlan {
  return FloorPlan.from(value) as FloorPlan;
}

/** A unit square polygon from (0,0) to (10,10). */
export function unitSquare(): Polygon {
  return Polygon.from([
    point(0, 0),
    point(10, 0),
    point(10, 10),
    point(0, 10),
  ]) as Polygon;
}

/** A square polygon shifted to the (100,100)-(110,110) region. */
export function distantSquare(): Polygon {
  return Polygon.from([
    point(100, 100),
    point(110, 100),
    point(110, 110),
    point(100, 110),
  ]) as Polygon;
}

export function aZone(values?: {
  id?: string;
  name?: string;
  color?: string;
  boundary?: Polygon;
}): Zone {
  return Zone.create(
    validZoneID(values?.id),
    validZoneName(values?.name),
    validColor(values?.color),
    values?.boundary ?? unitSquare(),
  );
}

export function aSmartFurnitureHookup(values?: {
  id?: string;
  position?: Point;
  zoneId?: ZoneID | null;
}): SmartFurnitureHookup {
  return SmartFurnitureHookup.create(
    validHookupID(values?.id),
    values?.position ?? point(5, 5),
    values?.zoneId ?? null,
  );
}

export function aHouseMap(values?: {
  id?: string;
  floorPlan?: FloorPlan;
}): HouseMap {
  return HouseMap.create(values?.floorPlan ?? validFloorPlan());
}
