import type { Logger } from "pino";
import { MongoServerError } from "mongodb";
import type { HouseMapRepository } from "@domain/ports/HouseMapRepository";
import { FloorPlan } from "@domain/values/FloorPlan";
import { Zone } from "@domain/entities/Zone";
import { ZoneID } from "@domain/values/ZoneID";
import { SmartFurnitureHookup } from "@domain/entities/SmartFurnitureHookup";
import { SmartFurnitureHookupID } from "@domain/values/SmartFurnitureHookupID";
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
  SmartFurnitureHookupNotFoundError,
  ZoneNameAlreadyExistsError,
  ZoneNotFoundError,
} from "@domain/errors";

export class MongooseHouseMapRepository implements HouseMapRepository {
  readonly #logger?: Logger;

  constructor(logger?: Logger) {
    this.#logger = logger;
  }

  async saveFloorPlan(floorPlan: FloorPlan): Promise<FloorPlan> {
    const doc = FloorPlanMapper.toPersistence(floorPlan);

    await FloorPlanModel.findOneAndReplace({ _id: FLOOR_PLAN_ID }, doc, {
      upsert: true,
      new: true,
    }).exec();

    return floorPlan;
  }

  async findFloorPlan(): Promise<FloorPlan | null> {
    const doc = await FloorPlanModel.findById(FLOOR_PLAN_ID).lean().exec();
    return doc ? FloorPlanMapper.toDomain(doc) : null;
  }

  async saveZone(zone: Zone): Promise<Zone> {
    const session = mongoSessionContext.getStore();

    try {
      const doc = new ZoneModel(ZoneMapper.toPersistence(zone));
      await doc.save({ session });
    } catch (error) {
      if ((error as MongoServerError).code === 11000) {
        this.#logger?.warn(
          { zoneId: zone.id.value },
          "Concurrency conflict: duplicate zone name on save",
        );
        if (Object.keys((error as MongoServerError).keyPattern)[0] === "name") {
          throw new ZoneNameAlreadyExistsError(zone.name.value);
        }
      }
      throw error;
    }

    return zone;
  }

  async updateZone(zone: Zone): Promise<Zone> {
    const session = mongoSessionContext.getStore();
    const doc = ZoneMapper.toPersistence(zone);

    try {
      const updated = await ZoneModel.findOneAndReplace(
        { _id: zone.id.value },
        doc,
        { session, new: true, runValidators: true },
      )
        .lean()
        .exec();

      if (!updated) {
        throw new ZoneNotFoundError(zone.id.value);
      }

      return ZoneMapper.toDomain(updated);
    } catch (error) {
      if ((error as MongoServerError).code === 11000) {
        this.#logger?.warn(
          { zoneId: zone.id.value },
          "Concurrency conflict: duplicate zone name on update",
        );
        if (Object.keys((error as MongoServerError).keyPattern)[0] === "name") {
          throw new ZoneNameAlreadyExistsError(zone.name.value);
        }
      }
      throw error;
    }
  }

  async findAllZones(): Promise<Zone[]> {
    const docs = await ZoneModel.find().lean().exec();
    return docs.map(ZoneMapper.toDomain);
  }

  async findZoneByID(id: ZoneID): Promise<Zone | null> {
    const doc = await ZoneModel.findById(id.value).lean().exec();
    return doc ? ZoneMapper.toDomain(doc) : null;
  }

  async removeZone(id: ZoneID): Promise<void> {
    const session = mongoSessionContext.getStore();
    const result = await ZoneModel.findByIdAndDelete(id.value, {
      session,
    }).exec();

    if (!result) {
      throw new ZoneNotFoundError(id.value);
    }
  }

  async saveSmartFurnitureHookup(
    smartFurnitureHookup: SmartFurnitureHookup,
  ): Promise<SmartFurnitureHookup> {
    const session = mongoSessionContext.getStore();

    const doc = new SmartFurnitureHookupModel(
      SmartFurnitureHookupMapper.toPersistence(smartFurnitureHookup),
    );

    await doc.save({ session });

    return smartFurnitureHookup;
  }

  async updateSmartFurnitureHookup(
    smartFurnitureHookup: SmartFurnitureHookup,
  ): Promise<SmartFurnitureHookup> {
    const session = mongoSessionContext.getStore();
    const doc = SmartFurnitureHookupMapper.toPersistence(smartFurnitureHookup);

    const updated = await SmartFurnitureHookupModel.findOneAndReplace(
      { _id: smartFurnitureHookup.id.value },
      doc,
      { session, new: true },
    )
      .lean()
      .exec();

    if (!updated) {
      throw new SmartFurnitureHookupNotFoundError(
        smartFurnitureHookup.id.value,
      );
    }

    return SmartFurnitureHookupMapper.toDomain(updated);
  }

  async findAllSmartFurnitureHookups(): Promise<SmartFurnitureHookup[]> {
    const docs = await SmartFurnitureHookupModel.find().lean().exec();
    return docs.map(SmartFurnitureHookupMapper.toDomain);
  }

  async findAllSmartFurnitureHookupsOfZone(
    zoneID: ZoneID,
  ): Promise<SmartFurnitureHookup[]> {
    const docs = await SmartFurnitureHookupModel.find({
      zoneId: zoneID.value,
    })
      .lean()
      .exec();
    return docs.map(SmartFurnitureHookupMapper.toDomain);
  }

  async findSmartFurnitureHookupByID(
    id: SmartFurnitureHookupID,
  ): Promise<SmartFurnitureHookup | null> {
    const doc = await SmartFurnitureHookupModel.findById(id.value)
      .lean()
      .exec();
    return doc ? SmartFurnitureHookupMapper.toDomain(doc) : null;
  }

  async removeSmartFurnitureHookup(id: SmartFurnitureHookupID): Promise<void> {
    const session = mongoSessionContext.getStore();
    const result = await SmartFurnitureHookupModel.findByIdAndDelete(id.value, {
      session,
    }).exec();

    if (!result) {
      throw new SmartFurnitureHookupNotFoundError(id.value);
    }
  }
}
