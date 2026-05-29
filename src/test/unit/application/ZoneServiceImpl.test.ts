import type { HouseMapRepository } from "@domain/ports/HouseMapRepository";
import type { EventPublisher } from "@application/outbound/EventPublisher";
import type { IdGenerator } from "@application/outbound/IdGenerator";
import type { BusinessMetrics } from "@application/outbound/BusinessMetrics";
import type { UnitOfWork } from "@application/outbound/UnitOfWork";
import { ZoneServiceImpl } from "@application/ZoneServiceImpl";
import { Zone } from "@domain/entities/Zone";
import {
  InvalidColorError,
  InvalidPolygonError,
  ZoneNameEmptyError,
  ZoneNotFoundError,
} from "@domain/errors";
import { SmartFurnitureHookupZoneChangedEvent } from "@domain/events/SmartFurnitureHookupAssignedToZoneEvent";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import {
  aSmartFurnitureHookup,
  aZone,
  point,
  unitSquare,
} from "@test/domainFactories";

// Vertex format used by ZoneServiceImpl — [[x, y], ...]
const UNIT_VERTICES: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];
const DISTANT_VERTICES: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [100, 100],
  [110, 100],
  [110, 110],
  [100, 110],
];

describe("ZoneServiceImpl", () => {
  let repository: MockProxy<HouseMapRepository>;
  let eventPublisher: MockProxy<EventPublisher>;
  let idGenerator: MockProxy<IdGenerator>;
  let uow: MockProxy<UnitOfWork>;
  let metrics: MockProxy<BusinessMetrics>;
  let service: ZoneServiceImpl;

  const generatedId = "generated-zone-id";

  beforeEach(() => {
    repository = mock<HouseMapRepository>();
    eventPublisher = mock<EventPublisher>();
    idGenerator = mock<IdGenerator>();
    uow = mock<UnitOfWork>();
    metrics = mock<BusinessMetrics>();

    idGenerator.generate.mockReturnValue(generatedId);
    uow.executeTransactionally.mockImplementation(async (cb) => cb());
    repository.saveZone.mockImplementation(async (z) => z);
    repository.updateZone.mockImplementation(async (z) => z);
    repository.findAllSmartFurnitureHookups.mockResolvedValue([]);

    service = new ZoneServiceImpl(
      repository,
      eventPublisher,
      idGenerator,
      uow,
      metrics,
    );
  });

  // ---------------------------------------------------------------------------
  // createZone
  // ---------------------------------------------------------------------------

  describe("createZone()", () => {
    it("should create a zone with the generated ID, save via UoW, record metrics, and return it", async () => {
      const result = await service.createZone(
        "Living Room",
        "#FF8800",
        UNIT_VERTICES,
      );

      expect(result).toBeInstanceOf(Zone);
      expect((result as Zone).id.toString()).toBe(generatedId);
      expect(uow.executeTransactionally).toHaveBeenCalledOnce();
      expect(repository.saveZone).toHaveBeenCalled();
      expect(metrics.recordZoneCreation).toHaveBeenCalledOnce();
    });

    it("should auto-assign hookups inside the new zone and publish their events", async () => {
      const hookupInside = aSmartFurnitureHookup({
        id: "sfh-1",
        position: point(5, 5),
      });
      const hookupOutside = aSmartFurnitureHookup({
        id: "sfh-2",
        position: point(200, 200),
      });
      repository.findAllSmartFurnitureHookups.mockResolvedValue([
        hookupInside,
        hookupOutside,
      ]);

      await service.createZone("Living Room", "#FF8800", UNIT_VERTICES);

      expect(repository.updateSmartFurnitureHookup).toHaveBeenCalledWith(
        hookupInside,
      );
      expect(repository.updateSmartFurnitureHookup).not.toHaveBeenCalledWith(
        hookupOutside,
      );
      expect(eventPublisher.publish).toHaveBeenCalledOnce();
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.any(SmartFurnitureHookupZoneChangedEvent),
      );
    });

    it("should return InvalidColorError for a malformed color without saving or recording metrics", async () => {
      const result = await service.createZone(
        "Living Room",
        "not-a-color",
        UNIT_VERTICES,
      );

      expect(result).toBeInstanceOf(InvalidColorError);
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordZoneCreation).not.toHaveBeenCalled();
    });

    it("should return ZoneNameEmptyError for an empty name without saving or recording metrics", async () => {
      const result = await service.createZone("", "#FF8800", UNIT_VERTICES);

      expect(result).toBeInstanceOf(ZoneNameEmptyError);
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordZoneCreation).not.toHaveBeenCalled();
    });

    it("should return InvalidPolygonError for fewer than 3 vertices without saving or recording metrics", async () => {
      const result = await service.createZone("Living Room", "#FF8800", [
        [0, 0],
        [10, 0],
      ]);

      expect(result).toBeInstanceOf(InvalidPolygonError);
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordZoneCreation).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getZones
  // ---------------------------------------------------------------------------

  describe("getZones()", () => {
    it("should return all zones from the repository", async () => {
      const zones = [aZone({ id: "zone-1" }), aZone({ id: "zone-2" })];
      repository.findAllZones.mockResolvedValue(zones);

      const result = await service.getZones();

      expect(result).toHaveLength(2);
      expect(result).toEqual(zones);
    });

    it("should return an empty array when no zones exist", async () => {
      repository.findAllZones.mockResolvedValue([]);

      expect(await service.getZones()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getZone
  // ---------------------------------------------------------------------------

  describe("getZone()", () => {
    it("should return the zone when found", async () => {
      const zone = aZone({ id: "zone-1" });
      repository.findZoneByID.mockResolvedValue(zone);

      const result = await service.getZone("zone-1");

      expect(result).toBeInstanceOf(Zone);
      expect(result?.id.toString()).toBe("zone-1");
    });

    it("should return null when the zone does not exist", async () => {
      repository.findZoneByID.mockResolvedValue(null);

      expect(await service.getZone("unknown")).toBeNull();
    });

    it("should return null for an empty ID without calling the repository", async () => {
      const result = await service.getZone("");

      expect(result).toBeNull();
      expect(repository.findZoneByID).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updateZone
  // ---------------------------------------------------------------------------

  describe("updateZone()", () => {
    it("should rename the zone, save via UoW, and record metrics", async () => {
      const zone = aZone({ id: "zone-1", name: "Old Name" });
      repository.findZoneByID.mockResolvedValue(zone);

      const result = await service.updateZone("zone-1", "New Name");

      expect(result).toBeInstanceOf(Zone);
      expect((result as Zone).name.toString()).toBe("New Name");
      expect(uow.executeTransactionally).toHaveBeenCalledOnce();
      expect(repository.updateZone).toHaveBeenCalledWith(zone);
      expect(metrics.recordZoneUpdate).toHaveBeenCalledOnce();
    });

    it("should recolor the zone and record metrics", async () => {
      const zone = aZone({ id: "zone-1" });
      repository.findZoneByID.mockResolvedValue(zone);

      const result = await service.updateZone("zone-1", undefined, "#123456");

      expect((result as Zone).color.toString()).toBe("#123456");
      expect(metrics.recordZoneUpdate).toHaveBeenCalledOnce();
    });

    it("should reshape zone, unassign hookups now outside, assign hookups now inside, and publish events", async () => {
      const zone = aZone({ id: "zone-1", boundary: unitSquare() }); // (0,0)-(10,10)
      const hookupMovingOut = aSmartFurnitureHookup({
        id: "sfh-1",
        position: point(5, 5),
        zoneId: zone.id,
      });
      const hookupMovingIn = aSmartFurnitureHookup({
        id: "sfh-2",
        position: point(105, 105),
      });

      repository.findZoneByID.mockResolvedValue(zone);
      repository.findAllSmartFurnitureHookups.mockResolvedValue([
        hookupMovingOut,
        hookupMovingIn,
      ]);

      await service.updateZone(
        "zone-1",
        undefined,
        undefined,
        DISTANT_VERTICES,
      );

      expect(hookupMovingOut.zoneId).toBeNull();
      expect(hookupMovingIn.zoneId?.toString()).toBe("zone-1");
      expect(uow.executeTransactionally).toHaveBeenCalledOnce();
      expect(repository.updateSmartFurnitureHookup).toHaveBeenCalledTimes(2);
      expect(eventPublisher.publish).toHaveBeenCalledTimes(2);
      expect(metrics.recordZoneUpdate).toHaveBeenCalledOnce();
    });

    it("should not scan hookups when only name or color is updated", async () => {
      const zone = aZone({ id: "zone-1" });
      repository.findZoneByID.mockResolvedValue(zone);

      await service.updateZone("zone-1", "Renamed", "#AABBCC");

      expect(repository.findAllSmartFurnitureHookups).not.toHaveBeenCalled();
      expect(repository.updateSmartFurnitureHookup).not.toHaveBeenCalled();
    });

    it("should return ZoneNotFoundError without saving or recording metrics", async () => {
      repository.findZoneByID.mockResolvedValue(null);

      const result = await service.updateZone("missing", "New Name");

      expect(result).toBeInstanceOf(ZoneNotFoundError);
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordZoneUpdate).not.toHaveBeenCalled();
    });

    it("should return InvalidColorError for a malformed color without saving or recording metrics", async () => {
      repository.findZoneByID.mockResolvedValue(aZone({ id: "zone-1" }));

      const result = await service.updateZone("zone-1", undefined, "bad-color");

      expect(result).toBeInstanceOf(InvalidColorError);
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordZoneUpdate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteZone
  // ---------------------------------------------------------------------------

  describe("deleteZone()", () => {
    it("should unassign hookups, remove zone, publish events via UoW, and record metrics", async () => {
      const zone = aZone({ id: "zone-1" });
      const assignedHookup = aSmartFurnitureHookup({
        id: "sfh-1",
        zoneId: zone.id,
      });

      repository.findZoneByID.mockResolvedValue(zone);
      repository.findAllSmartFurnitureHookupsOfZone.mockResolvedValue([
        assignedHookup,
      ]);

      const result = await service.deleteZone("zone-1");

      expect(result).toBeUndefined();
      expect(assignedHookup.zoneId).toBeNull();
      expect(uow.executeTransactionally).toHaveBeenCalledOnce();
      expect(repository.updateSmartFurnitureHookup).toHaveBeenCalledWith(
        assignedHookup,
      );
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.any(SmartFurnitureHookupZoneChangedEvent),
      );
      expect(repository.removeZone).toHaveBeenCalledWith(zone.id);
      expect(metrics.recordZoneDeletion).toHaveBeenCalledOnce();
    });

    it("should return ZoneNotFoundError without executing UoW or recording metrics", async () => {
      repository.findZoneByID.mockResolvedValue(null);

      const result = await service.deleteZone("zone-1");

      expect(result).toBeInstanceOf(ZoneNotFoundError);
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordZoneDeletion).not.toHaveBeenCalled();
    });

    it("should return an error for an empty ID without querying the repository", async () => {
      const result = await service.deleteZone("");

      expect(result).toBeInstanceOf(Error);
      expect(repository.findZoneByID).not.toHaveBeenCalled();
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordZoneDeletion).not.toHaveBeenCalled();
    });
  });
});
