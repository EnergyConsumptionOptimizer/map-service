import type { ClientSession } from "mongoose";
import { MongoServerError } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MongooseHouseMapRepository } from "@infrastructure/mongo/MongooseHouseMapRepository";
import {
  FloorPlanModel,
  FloorPlanMapper,
  FLOOR_PLAN_ID,
} from "@infrastructure/mongo/mongoose/FloorPlanModel";
import {
  ZoneModel,
  ZoneMapper,
} from "@infrastructure/mongo/mongoose/ZoneModel";
import {
  SmartFurnitureHookupModel,
  SmartFurnitureHookupMapper,
} from "@infrastructure/mongo/mongoose/SmartFurnitureHookupModel";
import { mongoSessionContext } from "@infrastructure/mongo/mongoSessionContext";
import {
  ZoneNotFoundError,
  SmartFurnitureHookupNotFoundError,
  ZoneNameAlreadyExistsError,
} from "@domain/errors";
import {
  aZone,
  aSmartFurnitureHookup,
  validFloorPlan,
  validZoneID,
  validHookupID,
} from "@test/domainFactories";

vi.mock("@infrastructure/mongo/mongoose/FloorPlanModel", () => ({
  FloorPlanModel: Object.assign(vi.fn(), {
    findOneAndReplace: vi.fn(),
    findById: vi.fn(),
  }),
  FloorPlanMapper: {
    toPersistence: vi.fn(),
    toDomain: vi.fn(),
  },
  FLOOR_PLAN_ID: "singleton-floor-plan",
}));

vi.mock("@infrastructure/mongo/mongoose/ZoneModel", () => ({
  ZoneModel: Object.assign(vi.fn(), {
    find: vi.fn(),
    findById: vi.fn(),
    findOneAndReplace: vi.fn(),
    findByIdAndDelete: vi.fn(),
  }),
  ZoneMapper: {
    toPersistence: vi.fn(),
    toDomain: vi.fn(),
  },
}));

vi.mock("@infrastructure/mongo/mongoose/SmartFurnitureHookupModel", () => ({
  SmartFurnitureHookupModel: Object.assign(vi.fn(), {
    find: vi.fn(),
    findById: vi.fn(),
    findOneAndReplace: vi.fn(),
    findByIdAndDelete: vi.fn(),
  }),
  SmartFurnitureHookupMapper: {
    toPersistence: vi.fn(),
    toDomain: vi.fn(),
  },
}));

vi.mock("@infrastructure/mongo/mongoSessionContext", () => ({
  mongoSessionContext: {
    getStore: vi.fn(),
  },
}));

function mockLeanExec(mockFn: ReturnType<typeof vi.fn>, returnValue: unknown) {
  mockFn.mockReturnValue({
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(returnValue),
  });
}

function mockExec(mockFn: ReturnType<typeof vi.fn>, returnValue: unknown) {
  mockFn.mockReturnValue({
    exec: vi.fn().mockResolvedValue(returnValue),
  });
}

function makeDuplicateKeyError(): MongoServerError {
  const error = new MongoServerError({ message: "duplicate key" });
  error.code = 11000;
  error.keyPattern = { name: 1 };
  return error;
}

function aFloorPlanDoc() {
  return { _id: FLOOR_PLAN_ID, svgContent: "<svg></svg>" };
}

function aZoneDoc() {
  return {
    _id: "zone-1",
    name: "Living Room",
    color: "#FF8800",
    vertices: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
  };
}

function aHookupDoc() {
  return { _id: "sfh-1", position: { x: 0, y: 0 }, zoneId: null };
}

describe("MongooseHouseMapRepository", () => {
  let repository: MongooseHouseMapRepository;
  let mockSession: ClientSession;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MongooseHouseMapRepository();
    mockSession = { id: "test-session" } as unknown as ClientSession;
    vi.mocked(mongoSessionContext.getStore).mockReturnValue(mockSession);
  });

  describe("saveFloorPlan()", () => {
    it("should upsert the floor plan and return the original entity", async () => {
      const fp = validFloorPlan();
      const doc = aFloorPlanDoc();
      vi.mocked(FloorPlanMapper.toPersistence).mockReturnValue(doc);
      mockExec(vi.mocked(FloorPlanModel.findOneAndReplace), doc);

      const result = await repository.saveFloorPlan(fp);

      expect(FloorPlanMapper.toPersistence).toHaveBeenCalledWith(fp);
      expect(FloorPlanModel.findOneAndReplace).toHaveBeenCalledWith(
        { _id: FLOOR_PLAN_ID },
        doc,
        { upsert: true, new: true },
      );
      expect(result).toBe(fp);
    });
  });

  describe("findFloorPlan()", () => {
    it("should return the domain entity when a document exists", async () => {
      const doc = aFloorPlanDoc();
      const fp = validFloorPlan();
      mockLeanExec(vi.mocked(FloorPlanModel.findById), doc);
      vi.mocked(FloorPlanMapper.toDomain).mockReturnValue(fp);

      const result = await repository.findFloorPlan();

      expect(FloorPlanModel.findById).toHaveBeenCalledWith(FLOOR_PLAN_ID);
      expect(FloorPlanMapper.toDomain).toHaveBeenCalledWith(doc);
      expect(result).toBe(fp);
    });

    it("should return null when no floor plan has been saved yet", async () => {
      mockLeanExec(vi.mocked(FloorPlanModel.findById), null);

      const result = await repository.findFloorPlan();

      expect(result).toBeNull();
      expect(FloorPlanMapper.toDomain).not.toHaveBeenCalled();
    });
  });

  describe("saveZone()", () => {
    it("should save the document within the active session and return the original entity", async () => {
      const zone = aZone({ id: "zone-1" });
      const doc = aZoneDoc();
      vi.mocked(ZoneMapper.toPersistence).mockReturnValue(doc);
      const saveMock = vi.fn().mockResolvedValue(doc);
      vi.mocked(ZoneModel).mockImplementation(
        class {
          save = saveMock;
        } as never,
      );

      const result = await repository.saveZone(zone);

      expect(ZoneMapper.toPersistence).toHaveBeenCalledWith(zone);
      expect(saveMock).toHaveBeenCalledWith({ session: mockSession });
      expect(result).toBe(zone);
    });

    it("should throw ZoneNameAlreadyExistsError on duplicate name", async () => {
      const zone = aZone();
      vi.mocked(ZoneMapper.toPersistence).mockReturnValue(aZoneDoc());
      const saveMock = vi.fn().mockRejectedValue(makeDuplicateKeyError());
      vi.mocked(ZoneModel).mockImplementation(
        class {
          save = saveMock;
        } as never,
      );

      await expect(repository.saveZone(zone)).rejects.toBeInstanceOf(
        ZoneNameAlreadyExistsError,
      );
    });

    it("should rethrow unexpected database errors", async () => {
      const zone = aZone();
      vi.mocked(ZoneMapper.toPersistence).mockReturnValue(aZoneDoc());
      const saveMock = vi.fn().mockRejectedValue(new Error("connection lost"));
      vi.mocked(ZoneModel).mockImplementation(
        class {
          save = saveMock;
        } as never,
      );

      await expect(repository.saveZone(zone)).rejects.toThrow(
        "connection lost",
      );
    });
  });

  describe("updateZone()", () => {
    it("should replace the document and return the updated domain entity", async () => {
      const zone = aZone({ id: "zone-1" });
      const doc = aZoneDoc();
      const updatedZone = aZone({ id: "zone-1", name: "Updated" });
      vi.mocked(ZoneMapper.toPersistence).mockReturnValue(doc);
      mockLeanExec(vi.mocked(ZoneModel.findOneAndReplace), doc);
      vi.mocked(ZoneMapper.toDomain).mockReturnValue(updatedZone);

      const result = await repository.updateZone(zone);

      expect(ZoneModel.findOneAndReplace).toHaveBeenCalledWith(
        { _id: zone.id.value },
        doc,
        { session: mockSession, new: true, runValidators: true },
      );
      expect(result).toBe(updatedZone);
    });

    it("should throw ZoneNotFoundError when no document is matched", async () => {
      const zone = aZone();
      vi.mocked(ZoneMapper.toPersistence).mockReturnValue(aZoneDoc());
      mockLeanExec(vi.mocked(ZoneModel.findOneAndReplace), null);

      await expect(repository.updateZone(zone)).rejects.toBeInstanceOf(
        ZoneNotFoundError,
      );
    });

    it("should rethrow a duplicate-key error from Mongo", async () => {
      const zone = aZone();
      vi.mocked(ZoneMapper.toPersistence).mockReturnValue(aZoneDoc());
      vi.mocked(ZoneModel.findOneAndReplace).mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockRejectedValue(makeDuplicateKeyError()),
      } as never);

      await expect(repository.updateZone(zone)).rejects.toThrow(
        ZoneNameAlreadyExistsError,
      );
    });
  });

  describe("findAllZones()", () => {
    it("should return all mapped zones", async () => {
      const docs = [
        aZoneDoc(),
        { ...aZoneDoc(), _id: "zone-2", name: "Bedroom" },
      ];
      const zones = [aZone({ id: "zone-1" }), aZone({ id: "zone-2" })];
      mockLeanExec(vi.mocked(ZoneModel.find), docs);
      vi.mocked(ZoneMapper.toDomain)
        .mockReturnValueOnce(zones[0])
        .mockReturnValueOnce(zones[1]);

      const result = await repository.findAllZones();

      expect(ZoneModel.find).toHaveBeenCalledWith();
      expect(ZoneMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it("should return an empty array when no zones exist", async () => {
      mockLeanExec(vi.mocked(ZoneModel.find), []);

      const result = await repository.findAllZones();

      expect(result).toEqual([]);
    });
  });

  describe("findZoneByID()", () => {
    it("should return the mapped zone when the document exists", async () => {
      const doc = aZoneDoc();
      const zone = aZone({ id: "zone-1" });
      mockLeanExec(vi.mocked(ZoneModel.findById), doc);
      vi.mocked(ZoneMapper.toDomain).mockReturnValue(zone);

      const result = await repository.findZoneByID(validZoneID("zone-1"));

      expect(ZoneModel.findById).toHaveBeenCalledWith("zone-1");
      expect(result).toBe(zone);
    });

    it("should return null when no document exists", async () => {
      mockLeanExec(vi.mocked(ZoneModel.findById), null);

      const result = await repository.findZoneByID(validZoneID("unknown"));

      expect(result).toBeNull();
    });
  });

  describe("removeZone()", () => {
    it("should delete the zone by id within the active session", async () => {
      mockExec(vi.mocked(ZoneModel.findByIdAndDelete), aZoneDoc());

      await repository.removeZone(validZoneID("zone-1"));

      expect(ZoneModel.findByIdAndDelete).toHaveBeenCalledWith("zone-1", {
        session: mockSession,
      });
    });

    it("should throw ZoneNotFoundError when no document is matched", async () => {
      mockExec(vi.mocked(ZoneModel.findByIdAndDelete), null);

      await expect(
        repository.removeZone(validZoneID("missing")),
      ).rejects.toBeInstanceOf(ZoneNotFoundError);
    });
  });

  describe("saveSmartFurnitureHookup()", () => {
    it("should save the document within the active session and return the original entity", async () => {
      const sfh = aSmartFurnitureHookup({ id: "sfh-1" });
      const doc = aHookupDoc();
      vi.mocked(SmartFurnitureHookupMapper.toPersistence).mockReturnValue(doc);
      const saveMock = vi.fn().mockResolvedValue(doc);
      vi.mocked(SmartFurnitureHookupModel).mockImplementation(
        class {
          save = saveMock;
        } as never,
      );

      const result = await repository.saveSmartFurnitureHookup(sfh);

      expect(SmartFurnitureHookupMapper.toPersistence).toHaveBeenCalledWith(
        sfh,
      );
      expect(saveMock).toHaveBeenCalledWith({ session: mockSession });
      expect(result).toBe(sfh);
    });

    it("should rethrow unexpected database errors", async () => {
      const sfh = aSmartFurnitureHookup();
      vi.mocked(SmartFurnitureHookupMapper.toPersistence).mockReturnValue(
        aHookupDoc(),
      );
      const saveMock = vi.fn().mockRejectedValue(new Error("connection lost"));
      vi.mocked(SmartFurnitureHookupModel).mockImplementation(
        class {
          save = saveMock;
        } as never,
      );

      await expect(repository.saveSmartFurnitureHookup(sfh)).rejects.toThrow(
        "connection lost",
      );
    });
  });

  describe("updateSmartFurnitureHookup()", () => {
    it("should replace the document and return the updated domain entity", async () => {
      const sfh = aSmartFurnitureHookup({ id: "sfh-1" });
      const doc = aHookupDoc();
      const updatedSfh = aSmartFurnitureHookup({ id: "sfh-1" });
      vi.mocked(SmartFurnitureHookupMapper.toPersistence).mockReturnValue(doc);
      mockLeanExec(vi.mocked(SmartFurnitureHookupModel.findOneAndReplace), doc);
      vi.mocked(SmartFurnitureHookupMapper.toDomain).mockReturnValue(
        updatedSfh,
      );

      const result = await repository.updateSmartFurnitureHookup(sfh);

      expect(SmartFurnitureHookupModel.findOneAndReplace).toHaveBeenCalledWith(
        { _id: sfh.id.value },
        doc,
        { session: mockSession, new: true },
      );
      expect(result).toBe(updatedSfh);
    });

    it("should throw SmartFurnitureHookupNotFoundError when no document is matched", async () => {
      const sfh = aSmartFurnitureHookup();
      vi.mocked(SmartFurnitureHookupMapper.toPersistence).mockReturnValue(
        aHookupDoc(),
      );
      mockLeanExec(
        vi.mocked(SmartFurnitureHookupModel.findOneAndReplace),
        null,
      );

      await expect(
        repository.updateSmartFurnitureHookup(sfh),
      ).rejects.toBeInstanceOf(SmartFurnitureHookupNotFoundError);
    });
  });

  describe("findAllSmartFurnitureHookups()", () => {
    it("should return all mapped hookups", async () => {
      const docs = [aHookupDoc(), { ...aHookupDoc(), _id: "sfh-2" }];
      const hookups = [
        aSmartFurnitureHookup({ id: "sfh-1" }),
        aSmartFurnitureHookup({ id: "sfh-2" }),
      ];
      mockLeanExec(vi.mocked(SmartFurnitureHookupModel.find), docs);
      vi.mocked(SmartFurnitureHookupMapper.toDomain)
        .mockReturnValueOnce(hookups[0])
        .mockReturnValueOnce(hookups[1]);

      const result = await repository.findAllSmartFurnitureHookups();

      expect(SmartFurnitureHookupModel.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
    });

    it("should return an empty array when no hookups exist", async () => {
      mockLeanExec(vi.mocked(SmartFurnitureHookupModel.find), []);

      expect(await repository.findAllSmartFurnitureHookups()).toEqual([]);
    });
  });

  describe("findAllSmartFurnitureHookupsOfZone()", () => {
    it("should query by zoneId and return the mapped hookups", async () => {
      const docs = [{ ...aHookupDoc(), zoneId: "zone-1" }];
      const sfh = aSmartFurnitureHookup({ id: "sfh-1" });
      mockLeanExec(vi.mocked(SmartFurnitureHookupModel.find), docs);
      vi.mocked(SmartFurnitureHookupMapper.toDomain).mockReturnValue(sfh);

      const result = await repository.findAllSmartFurnitureHookupsOfZone(
        validZoneID("zone-1"),
      );

      expect(SmartFurnitureHookupModel.find).toHaveBeenCalledWith({
        zoneId: "zone-1",
      });
      expect(result).toHaveLength(1);
    });

    it("should return an empty array when the zone has no hookups", async () => {
      mockLeanExec(vi.mocked(SmartFurnitureHookupModel.find), []);

      const result = await repository.findAllSmartFurnitureHookupsOfZone(
        validZoneID("empty-zone"),
      );

      expect(result).toEqual([]);
    });
  });

  describe("findSmartFurnitureHookupByID()", () => {
    it("should return the mapped hookup when the document exists", async () => {
      const doc = aHookupDoc();
      const sfh = aSmartFurnitureHookup({ id: "sfh-1" });
      mockLeanExec(vi.mocked(SmartFurnitureHookupModel.findById), doc);
      vi.mocked(SmartFurnitureHookupMapper.toDomain).mockReturnValue(sfh);

      const result = await repository.findSmartFurnitureHookupByID(
        validHookupID("sfh-1"),
      );

      expect(SmartFurnitureHookupModel.findById).toHaveBeenCalledWith("sfh-1");
      expect(result).toBe(sfh);
    });

    it("should return null when no document exists", async () => {
      mockLeanExec(vi.mocked(SmartFurnitureHookupModel.findById), null);

      const result = await repository.findSmartFurnitureHookupByID(
        validHookupID("unknown"),
      );

      expect(result).toBeNull();
    });
  });

  describe("removeSmartFurnitureHookup()", () => {
    it("should delete the hookup by id within the active session", async () => {
      mockExec(
        vi.mocked(SmartFurnitureHookupModel.findByIdAndDelete),
        aHookupDoc(),
      );

      await repository.removeSmartFurnitureHookup(validHookupID("sfh-1"));

      expect(SmartFurnitureHookupModel.findByIdAndDelete).toHaveBeenCalledWith(
        "sfh-1",
        { session: mockSession },
      );
    });

    it("should throw SmartFurnitureHookupNotFoundError when no document is matched", async () => {
      mockExec(vi.mocked(SmartFurnitureHookupModel.findByIdAndDelete), null);

      await expect(
        repository.removeSmartFurnitureHookup(validHookupID("missing")),
      ).rejects.toBeInstanceOf(SmartFurnitureHookupNotFoundError);
    });

    it("should rethrow unexpected database errors", async () => {
      vi.mocked(SmartFurnitureHookupModel.findByIdAndDelete).mockReturnValue({
        exec: vi.fn().mockRejectedValue(new Error("delete failed")),
      } as never);

      await expect(
        repository.removeSmartFurnitureHookup(validHookupID("sfh-1")),
      ).rejects.toThrow("delete failed");
    });
  });
});
