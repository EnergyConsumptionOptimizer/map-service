import type { HouseMapRepository } from "@domain/ports/HouseMapRepository";
import type { EventPublisher } from "@application/outbound/EventPublisher";
import type { BusinessMetrics } from "@application/outbound/BusinessMetrics";
import type { UnitOfWork } from "@application/outbound/UnitOfWork";
import type { SmartFurnitureHookupServicePort } from "@application/outbound/SmartFurnitureHookupServicePort";
import { SmartFurnitureHookupServiceImpl } from "@application/SmartFurnitureHookupServiceImpl";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import {
  SmartFurnitureHookupNotFoundError,
  ZoneNotFoundError,
} from "@domain/errors";
import { SmartFurnitureHookupZoneChangedEvent } from "@domain/events/SmartFurnitureHookupAssignedToZoneEvent";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import {
  aSmartFurnitureHookup,
  aZone,
  distantSquare,
  unitSquare,
} from "@test/domainFactories";

describe("SmartFurnitureHookupServiceImpl", () => {
  let smartFurnitureHookupServicePort: MockProxy<SmartFurnitureHookupServicePort>;
  let repository: MockProxy<HouseMapRepository>;
  let uow: MockProxy<UnitOfWork>;
  let eventPublisher: MockProxy<EventPublisher>;
  let metrics: MockProxy<BusinessMetrics>;
  let service: SmartFurnitureHookupServiceImpl;

  beforeEach(() => {
    smartFurnitureHookupServicePort = mock<SmartFurnitureHookupServicePort>();
    repository = mock<HouseMapRepository>();
    uow = mock<UnitOfWork>();
    eventPublisher = mock<EventPublisher>();
    metrics = mock<BusinessMetrics>();

    uow.executeTransactionally.mockImplementation(async (fn) => fn());
    repository.saveSmartFurnitureHookup.mockImplementation(async (h) => h);
    repository.updateSmartFurnitureHookup.mockImplementation(async (h) => h);
    repository.findAllZones.mockResolvedValue([]);

    service = new SmartFurnitureHookupServiceImpl(
      smartFurnitureHookupServicePort,
      repository,
      uow,
      eventPublisher,
      metrics,
    );
  });

  describe("createSmartFurnitureHookup()", () => {
    it("should create a hookup at (0,0) with UNSET zone, save it, record metrics, and return it", async () => {
      const result = await service.createSmartFurnitureHookup("sfh-1");

      expect(result).toBeInstanceOf(SmartFurnitureHookup);
      const hookup = result as SmartFurnitureHookup;
      expect(hookup.id.toString()).toBe("sfh-1");
      expect(hookup.position).toMatchObject({ x: 0, y: 0 });
      expect(repository.saveSmartFurnitureHookup).toHaveBeenCalledWith(hookup);
      expect(metrics.recordSmartFurnitureHookupCreation).toHaveBeenCalledOnce();
    });

    it("should return an error for an empty ID without saving or recording metrics", async () => {
      const result = await service.createSmartFurnitureHookup("");

      expect(result).toBeInstanceOf(Error);
      expect(repository.saveSmartFurnitureHookup).not.toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupCreation).not.toHaveBeenCalled();
    });
  });

  describe("getSmartFurnitureHookups()", () => {
    it("should return all hookups from the repository", async () => {
      const hookups = [
        aSmartFurnitureHookup({ id: "sfh-1" }),
        aSmartFurnitureHookup({ id: "sfh-2" }),
      ];
      repository.findAllSmartFurnitureHookups.mockResolvedValue(hookups);

      const result = await service.getSmartFurnitureHookups();

      expect(result).toHaveLength(2);
      expect(result).toEqual(hookups);
    });

    it("should return an empty array when no hookups exist", async () => {
      repository.findAllSmartFurnitureHookups.mockResolvedValue([]);

      expect(await service.getSmartFurnitureHookups()).toEqual([]);
    });
  });

  describe("getSmartFurnitureHookup()", () => {
    it("should return the hookup when found in the repository", async () => {
      const hookup = aSmartFurnitureHookup({ id: "sfh-1" });
      repository.findSmartFurnitureHookupByID.mockResolvedValue(hookup);

      const result = await service.getSmartFurnitureHookup("sfh-1");

      expect(result).toBeInstanceOf(SmartFurnitureHookup);
      expect((result as SmartFurnitureHookup).id.toString()).toBe("sfh-1");
    });

    it("should return SmartFurnitureHookupNotFoundError when not in the repository", async () => {
      repository.findSmartFurnitureHookupByID.mockResolvedValue(null);

      const result = await service.getSmartFurnitureHookup("sfh-1");

      expect(result).toBeInstanceOf(SmartFurnitureHookupNotFoundError);
    });

    it("should return an error for an empty ID without calling the repository", async () => {
      const result = await service.getSmartFurnitureHookup("");

      expect(result).toBeInstanceOf(Error);
      expect(repository.findSmartFurnitureHookupByID).not.toHaveBeenCalled();
    });
  });

  describe("updateSmartFurnitureHookup()", () => {
    function portReturnsHookup() {
      smartFurnitureHookupServicePort.smartFurnitureHookupExists.mockResolvedValue(
        true,
      );
    }

    function portReturnsError() {
      smartFurnitureHookupServicePort.smartFurnitureHookupExists.mockResolvedValue(
        new SmartFurnitureHookupNotFoundError("sfh-1"),
      );
    }

    it("should return an error immediately when the external port does not know the hookup", async () => {
      portReturnsError();

      const result = await service.updateSmartFurnitureHookup("sfh-1");

      expect(result).toBeInstanceOf(Error);
      expect(repository.saveSmartFurnitureHookup).not.toHaveBeenCalled();
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupUpdate).not.toHaveBeenCalled();
    });

    it("should create the hookup in the local repo when the port confirms it exists", async () => {
      portReturnsHookup();

      const result = await service.updateSmartFurnitureHookup("sfh-1");

      expect(result).toBeInstanceOf(SmartFurnitureHookup);
      expect(repository.saveSmartFurnitureHookup).toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupCreation).toHaveBeenCalled();
      expect(uow.executeTransactionally).toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupUpdate).toHaveBeenCalledOnce();
    });

    it("should move the hookup to the new position when position is provided", async () => {
      portReturnsHookup();

      const result = await service.updateSmartFurnitureHookup("sfh-1", [7, 3]);

      expect(result).toBeInstanceOf(SmartFurnitureHookup);
      expect((result as SmartFurnitureHookup).position).toMatchObject({
        x: 7,
        y: 3,
      });
    });

    it("should auto-assign to a zone when new position falls inside one", async () => {
      portReturnsHookup();
      const zone = aZone({ id: "zone-1", boundary: unitSquare() });
      repository.findAllZones.mockResolvedValue([zone]);

      const result = await service.updateSmartFurnitureHookup("sfh-1", [5, 5]);

      expect((result as SmartFurnitureHookup).zoneId?.toString()).toBe(
        "zone-1",
      );
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.any(SmartFurnitureHookupZoneChangedEvent),
      );
    });

    it("should unassign the hookup when new position falls outside all zones", async () => {
      portReturnsHookup();
      repository.findAllZones.mockResolvedValue([
        aZone({ id: "zone-1", boundary: unitSquare() }),
      ]);

      const result = await service.updateSmartFurnitureHookup(
        "sfh-1",
        [200, 200],
      );

      expect((result as SmartFurnitureHookup).zoneId).toBeNull();
    });

    it("should assign to the given zoneID when the hookup is inside that zone", async () => {
      portReturnsHookup();
      const zone = aZone({ id: "zone-1", boundary: unitSquare() });
      repository.findZoneByID.mockResolvedValue(zone);

      const result = await service.updateSmartFurnitureHookup(
        "sfh-1",
        [5, 5],
        "zone-1",
      );

      expect((result as SmartFurnitureHookup).zoneId?.toString()).toBe(
        "zone-1",
      );
    });

    it("should fall back to position-based zone detection when hookup is outside the given zone", async () => {
      portReturnsHookup();
      const givenZone = aZone({
        id: "zone-distant",
        boundary: distantSquare(),
      });
      const fallbackZone = aZone({
        id: "zone-fallback",
        boundary: unitSquare(),
      });
      repository.findZoneByID.mockResolvedValue(givenZone);
      repository.findAllZones.mockResolvedValue([fallbackZone]);

      const result = await service.updateSmartFurnitureHookup(
        "sfh-1",
        undefined,
        "zone-distant",
      );

      expect((result as SmartFurnitureHookup).zoneId?.toString()).toBe(
        "zone-fallback",
      );
    });

    it("should return ZoneNotFoundError when the given zoneID does not exist in the repository", async () => {
      portReturnsHookup();
      repository.findZoneByID.mockResolvedValue(null);

      const result = await service.updateSmartFurnitureHookup(
        "sfh-1",
        undefined,
        "missing-zone",
      );

      expect(result).toBeInstanceOf(ZoneNotFoundError);
      expect(uow.executeTransactionally).not.toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupUpdate).not.toHaveBeenCalled();
    });

    it("should return an error for an empty ID without contacting the port", async () => {
      const result = await service.updateSmartFurnitureHookup("");

      expect(result).toBeInstanceOf(Error);
      expect(
        smartFurnitureHookupServicePort.smartFurnitureHookupExists,
      ).not.toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupUpdate).not.toHaveBeenCalled();
    });

    it("should return an error for invalid coordinates without contacting the port", async () => {
      const result = await service.updateSmartFurnitureHookup("sfh-1", [
        NaN,
        5,
      ]);

      expect(result).toBeInstanceOf(Error);
      expect(
        smartFurnitureHookupServicePort.smartFurnitureHookupExists,
      ).not.toHaveBeenCalled();
    });
  });

  describe("deleteSmartFurnitureHookup()", () => {
    it("should remove the hookup, record metrics, and return undefined", async () => {
      const hookup = aSmartFurnitureHookup({ id: "sfh-1" });
      repository.findSmartFurnitureHookupByID.mockResolvedValue(hookup);

      const result = await service.deleteSmartFurnitureHookup("sfh-1");

      expect(result).toBeUndefined();
      expect(repository.removeSmartFurnitureHookup).toHaveBeenCalledWith(
        hookup.id,
      );
      expect(metrics.recordSmartFurnitureHookupDeletion).toHaveBeenCalledOnce();
    });

    it("should return SmartFurnitureHookupNotFoundError without removing or recording metrics", async () => {
      repository.findSmartFurnitureHookupByID.mockResolvedValue(null);

      const result = await service.deleteSmartFurnitureHookup("sfh-1");

      expect(result).toBeInstanceOf(SmartFurnitureHookupNotFoundError);
      expect(repository.removeSmartFurnitureHookup).not.toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupDeletion).not.toHaveBeenCalled();
    });

    it("should return an error for an empty ID without querying the repository", async () => {
      const result = await service.deleteSmartFurnitureHookup("");

      expect(result).toBeInstanceOf(Error);
      expect(repository.findSmartFurnitureHookupByID).not.toHaveBeenCalled();
      expect(metrics.recordSmartFurnitureHookupDeletion).not.toHaveBeenCalled();
    });
  });
});
