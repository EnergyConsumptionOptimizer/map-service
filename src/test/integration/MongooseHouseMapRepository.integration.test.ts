import pino from "pino";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongooseHouseMapRepository } from "@infrastructure/mongo/MongooseHouseMapRepository";
import {
  FloorPlanModel,
  FLOOR_PLAN_ID,
} from "@infrastructure/mongo/mongoose/FloorPlanModel";
import { ZoneModel } from "@infrastructure/mongo/mongoose/ZoneModel";
import { SmartFurnitureHookupModel } from "@infrastructure/mongo/mongoose/SmartFurnitureHookupModel";
import { FloorPlan } from "@domain/values/FloorPlan";
import { Zone } from "@domain/entities/Zone";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import {
  ZoneNotFoundError,
  SmartFurnitureHookupNotFoundError,
} from "@domain/errors";
import {
  aZone,
  aSmartFurnitureHookup,
  validFloorPlan,
  validZoneID,
  validHookupID,
  point,
} from "@test/domainFactories";
import {
  seedFloorPlan,
  seedZone,
  seedSmartFurnitureHookup,
} from "@test/integration/seed";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";

describe("MongooseHouseMapRepository (integration)", () => {
  let repository: MongooseHouseMapRepository;

  beforeAll(async () => {
    await startMongo();
    repository = new MongooseHouseMapRepository(pino({ level: "silent" }));

    // Ensure collections + indexes exist
    await FloorPlanModel.createCollection();
    await ZoneModel.createCollection();
    await ZoneModel.init(); // ensures the unique index on `name` is created
    await SmartFurnitureHookupModel.createCollection();
  });

  afterAll(stopMongo);

  beforeEach(clearDatabase);

  describe("saveFloorPlan()", () => {
    it("creates (upserts) the floor plan document and returns the entity", async () => {
      const fp = validFloorPlan("<svg><rect/></svg>");

      const result = await repository.saveFloorPlan(fp);

      expect(result).toBeInstanceOf(FloorPlan);
      const doc = await FloorPlanModel.findById(FLOOR_PLAN_ID).lean().exec();
      expect(doc?.svgContent).toBe("<svg><rect/></svg>");
    });

    it("replaces the existing floor plan on second save (singleton upsert)", async () => {
      await repository.saveFloorPlan(validFloorPlan("<svg>old</svg>"));
      await repository.saveFloorPlan(validFloorPlan("<svg>new</svg>"));

      const doc = await FloorPlanModel.findById(FLOOR_PLAN_ID).lean().exec();
      expect(doc?.svgContent).toBe("<svg>new</svg>");
    });
  });

  describe("findFloorPlan()", () => {
    it("returns the floor plan when it exists", async () => {
      await seedFloorPlan("<svg><circle/></svg>");

      const result = await repository.findFloorPlan();

      expect(result).toBeInstanceOf(FloorPlan);
      expect(result?.svgContent).toBe("<svg><circle/></svg>");
    });

    it("returns null when no floor plan has been saved", async () => {
      expect(await repository.findFloorPlan()).toBeNull();
    });
  });

  describe("saveZone()", () => {
    it("persists the zone and returns it", async () => {
      const zone = aZone({ id: "zone-1", name: "Kitchen" });

      const result = await repository.saveZone(zone);

      expect(result).toBeInstanceOf(Zone);
      const doc = await ZoneModel.findById("zone-1").lean().exec();
      expect(doc?.name).toBe("Kitchen");
    });

    it("return ZoneNotFoundError on duplicate zone name", async () => {
      await seedZone("z-1", "Living Room");

      const duplicate = aZone({ id: "z-2", name: "Living Room" });

      await expect(repository.updateZone(duplicate)).rejects.toBeInstanceOf(
        ZoneNotFoundError,
      );
    });
  });

  describe("updateZone()", () => {
    it("replaces the zone document and returns the updated entity", async () => {
      await seedZone("zone-upd", "Old Name");
      const updated = aZone({ id: "zone-upd", name: "New Name" });

      const result = await repository.updateZone(updated);

      expect(result).toBeInstanceOf(Zone);
      expect(result.name.value).toBe("New Name");
      const doc = await ZoneModel.findById("zone-upd").lean().exec();
      expect(doc?.name).toBe("New Name");
    });

    it("throws ZoneNotFoundError when the document does not exist", async () => {
      const ghost = aZone({ id: "ghost-zone" });

      await expect(repository.updateZone(ghost)).rejects.toBeInstanceOf(
        ZoneNotFoundError,
      );
    });
  });

  describe("findAllZones()", () => {
    it("returns all zone entities", async () => {
      await seedZone("z-1", "Zone 1");
      await seedZone("z-2", "Zone 2");

      const result = await repository.findAllZones();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Zone);
    });

    it("returns an empty array when no zones exist", async () => {
      expect(await repository.findAllZones()).toEqual([]);
    });
  });

  describe("findZoneByID()", () => {
    it("returns the zone when it exists", async () => {
      await seedZone("zone-find", "Find Me");

      const result = await repository.findZoneByID(validZoneID("zone-find"));

      expect(result).toBeInstanceOf(Zone);
      expect(result?.id.value).toBe("zone-find");
    });

    it("returns null when the zone does not exist", async () => {
      expect(await repository.findZoneByID(validZoneID("unknown"))).toBeNull();
    });
  });

  describe("removeZone()", () => {
    it("deletes the zone document from the database", async () => {
      await seedZone("zone-del", "To Delete");

      await repository.removeZone(validZoneID("zone-del"));

      expect(await ZoneModel.findById("zone-del").lean().exec()).toBeNull();
    });

    it("throws ZoneNotFoundError when the document does not exist", async () => {
      await expect(
        repository.removeZone(validZoneID("ghost")),
      ).rejects.toBeInstanceOf(ZoneNotFoundError);
    });
  });

  describe("saveSmartFurnitureHookup()", () => {
    it("persists the hookup and returns it", async () => {
      const sfh = aSmartFurnitureHookup({ id: "sfh-1", position: point(3, 7) });

      const result = await repository.saveSmartFurnitureHookup(sfh);

      expect(result).toBeInstanceOf(SmartFurnitureHookup);
      const doc = await SmartFurnitureHookupModel.findById("sfh-1")
        .lean()
        .exec();
      expect(doc?.position).toMatchObject({ x: 3, y: 7 });
    });
  });

  describe("updateSmartFurnitureHookup()", () => {
    it("replaces the document and returns the updated entity", async () => {
      await seedSmartFurnitureHookup("sfh-upd", 0, 0);

      const updated = aSmartFurnitureHookup({
        id: "sfh-upd",
        position: point(9, 9),
      });

      const result = await repository.updateSmartFurnitureHookup(updated);

      expect(result).toBeInstanceOf(SmartFurnitureHookup);
      expect(result.position).toMatchObject({ x: 9, y: 9 });
    });

    it("throws SmartFurnitureHookupNotFoundError when document does not exist", async () => {
      const ghost = aSmartFurnitureHookup({ id: "ghost-sfh" });

      await expect(
        repository.updateSmartFurnitureHookup(ghost),
      ).rejects.toBeInstanceOf(SmartFurnitureHookupNotFoundError);
    });
  });

  describe("findAllSmartFurnitureHookups()", () => {
    it("returns all hookup entities", async () => {
      await seedSmartFurnitureHookup("sfh-1");
      await seedSmartFurnitureHookup("sfh-2");

      const result = await repository.findAllSmartFurnitureHookups();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SmartFurnitureHookup);
    });

    it("returns an empty array when no hookups exist", async () => {
      expect(await repository.findAllSmartFurnitureHookups()).toEqual([]);
    });
  });

  describe("findAllSmartFurnitureHookupsOfZone()", () => {
    it("returns only hookups assigned to the given zone", async () => {
      await seedSmartFurnitureHookup("sfh-in", 5, 5, "zone-a");
      await seedSmartFurnitureHookup("sfh-out", 5, 5, null);

      const result = await repository.findAllSmartFurnitureHookupsOfZone(
        validZoneID("zone-a"),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id.value).toBe("sfh-in");
    });

    it("returns an empty array when the zone has no hookups", async () => {
      expect(
        await repository.findAllSmartFurnitureHookupsOfZone(
          validZoneID("empty-zone"),
        ),
      ).toEqual([]);
    });
  });

  describe("findSmartFurnitureHookupByID()", () => {
    it("returns the hookup when it exists", async () => {
      await seedSmartFurnitureHookup("sfh-find", 1, 2);

      const result = await repository.findSmartFurnitureHookupByID(
        validHookupID("sfh-find"),
      );

      expect(result).toBeInstanceOf(SmartFurnitureHookup);
      expect(result?.id.value).toBe("sfh-find");
      expect(result?.position).toMatchObject({ x: 1, y: 2 });
    });

    it("returns null when the hookup does not exist", async () => {
      expect(
        await repository.findSmartFurnitureHookupByID(validHookupID("unknown")),
      ).toBeNull();
    });
  });

  describe("removeSmartFurnitureHookup()", () => {
    it("deletes the document from the database", async () => {
      await seedSmartFurnitureHookup("sfh-del");

      await repository.removeSmartFurnitureHookup(validHookupID("sfh-del"));

      expect(
        await SmartFurnitureHookupModel.findById("sfh-del").lean().exec(),
      ).toBeNull();
    });

    it("throws SmartFurnitureHookupNotFoundError when document does not exist", async () => {
      await expect(
        repository.removeSmartFurnitureHookup(validHookupID("ghost")),
      ).rejects.toBeInstanceOf(SmartFurnitureHookupNotFoundError);
    });
  });
});
