import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoOutboxEventPublisher } from "@infrastructure/events/MongoOutboxEventPublisher";
import {
  OutboxEvent,
  type OutboxEventDoc,
} from "@infrastructure/events/OutboxEvent";
import { MongoUnitOfWork } from "@infrastructure/mongo/MongoUnitOfWork";
import { MongooseHouseMapRepository } from "@infrastructure/mongo/MongooseHouseMapRepository";
import { ZoneModel } from "@infrastructure/mongo/mongoose/ZoneModel";
import { SmartFurnitureHookupModel } from "@infrastructure/mongo/mongoose/SmartFurnitureHookupModel";
import {
  aSmartFurnitureHookup,
  validHookupID,
  validZoneID,
} from "@test/domainFactories";
import { seedSmartFurnitureHookup, seedZone } from "@test/integration/seed";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";

describe("Outbox Pattern (integration) — HouseMap", () => {
  let uow: MongoUnitOfWork;
  let repository: MongooseHouseMapRepository;
  let eventPublisher: MongoOutboxEventPublisher;

  beforeAll(async () => {
    await startMongo();
    uow = new MongoUnitOfWork();
    repository = new MongooseHouseMapRepository();
    eventPublisher = new MongoOutboxEventPublisher();

    await OutboxEvent.createCollection();
    await ZoneModel.createCollection();
    await ZoneModel.init();
    await SmartFurnitureHookupModel.createCollection();
  });

  afterAll(stopMongo);

  beforeEach(clearDatabase);

  const findAllOutboxEvents = (): Promise<OutboxEventDoc[]> =>
    OutboxEvent.find({}).sort({ createdAt: 1 }).lean().exec();

  it("persists hookup and its ZoneChanged event atomically when zone is assigned", async () => {
    await seedSmartFurnitureHookup("sfh-1", 5, 5);
    const sfh = await repository.findSmartFurnitureHookupByID(
      validHookupID("sfh-1"),
    );
    if (!sfh) return;
    sfh.assignToZone(validZoneID("zone-1"));

    await uow.executeTransactionally(async () => {
      await repository.updateSmartFurnitureHookup(sfh);
      for (const event of sfh.pullDomainEvents()) {
        await eventPublisher.publish(event);
      }
    });

    const saved = await SmartFurnitureHookupModel.findById("sfh-1")
      .lean()
      .exec();
    expect(saved?.zoneId).toBe("zone-1");

    const outbox = await findAllOutboxEvents();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({
      eventType: "SmartFurnitureHookupZoneChangedEvent",
      aggregateType: "HouseMap",
      payload: { smartFurnitureHookupId: "sfh-1", zoneId: "zone-1" },
    });
  });

  it("persists hookup and its ZoneChanged event atomically when zone is unassigned", async () => {
    await seedSmartFurnitureHookup("sfh-2", 5, 5, "zone-1");
    const sfh = await repository.findSmartFurnitureHookupByID(
      validHookupID("sfh-2"),
    );
    if (!sfh) return;
    sfh.unassignZone();

    await uow.executeTransactionally(async () => {
      await repository.updateSmartFurnitureHookup(sfh);
      for (const event of sfh.pullDomainEvents()) {
        await eventPublisher.publish(event);
      }
    });

    const saved = await SmartFurnitureHookupModel.findById("sfh-2")
      .lean()
      .exec();
    expect(saved?.zoneId).toBeNull();

    const outbox = await findAllOutboxEvents();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({
      eventType: "SmartFurnitureHookupZoneChangedEvent",
      payload: { smartFurnitureHookupId: "sfh-2", zoneId: null },
    });
  });

  it("persists zone deletion and ZoneDeletedEvent atomically", async () => {
    await seedZone("zone-del", "To Delete");
    const zone = await repository.findZoneByID(validZoneID("zone-del"));
    if (!zone) return;
    zone.prepareForDeletion();

    await uow.executeTransactionally(async () => {
      await repository.removeZone(zone.id);
      for (const event of zone.pullDomainEvents()) {
        await eventPublisher.publish(event);
      }
    });

    expect(await ZoneModel.findById("zone-del").lean().exec()).toBeNull();

    const outbox = await findAllOutboxEvents();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({
      eventType: "ZoneDeletedEvent",
      aggregateType: "HouseMap",
      payload: { zoneId: "zone-del" },
    });
  });

  it("publishes multiple hookup zone events in a single transaction", async () => {
    await seedSmartFurnitureHookup("sfh-a", 1, 1);
    await seedSmartFurnitureHookup("sfh-b", 2, 2);

    const sfhA = await repository.findSmartFurnitureHookupByID(
      validHookupID("sfh-a"),
    );
    const sfhB = await repository.findSmartFurnitureHookupByID(
      validHookupID("sfh-b"),
    );
    if (!sfhA || !sfhB) return;

    sfhA.assignToZone(validZoneID("zone-x"));
    sfhB.assignToZone(validZoneID("zone-x"));

    await uow.executeTransactionally(async () => {
      await repository.updateSmartFurnitureHookup(sfhA);
      await repository.updateSmartFurnitureHookup(sfhB);
      for (const event of [
        ...sfhA.pullDomainEvents(),
        ...sfhB.pullDomainEvents(),
      ]) {
        await eventPublisher.publish(event);
      }
    });

    const outbox = await findAllOutboxEvents();
    expect(outbox).toHaveLength(2);
    expect(
      outbox.every(
        (e) => e.eventType === "SmartFurnitureHookupZoneChangedEvent",
      ),
    ).toBe(true);
  });

  it("rolls back hookup update and outbox event when transaction fails", async () => {
    await seedSmartFurnitureHookup("sfh-rollback", 0, 0);

    const sfh = await repository.findSmartFurnitureHookupByID(
      validHookupID("sfh-rollback"),
    );
    if (!sfh) return;
    sfh.assignToZone(validZoneID("zone-y"));

    const events = sfh.pullDomainEvents();

    await expect(
      uow.executeTransactionally(async () => {
        await repository.updateSmartFurnitureHookup(sfh);
        for (const event of events) {
          await eventPublisher.publish(event);
        }
        throw new Error("forced rollback");
      }),
    ).rejects.toThrow("forced rollback");

    const doc = await SmartFurnitureHookupModel.findById("sfh-rollback")
      .lean()
      .exec();
    expect(doc?.zoneId).toBeNull();

    expect(await findAllOutboxEvents()).toHaveLength(0);
  });

  it("throws when event publisher is called outside a UnitOfWork", async () => {
    const sfh = aSmartFurnitureHookup({ id: "sfh-guard" });
    sfh.assignToZone(validZoneID("zone-g"));
    const [event] = sfh.pullDomainEvents();

    await expect(eventPublisher.publish(event)).rejects.toThrow(
      "EventPublisher must always be called inside an UnitOfWork",
    );
  });

  it("publishes SmartFurnitureHookupZoneChangedEvent with correct payload shape", async () => {
    await seedSmartFurnitureHookup("sfh-ev", 3, 3);
    const sfh = await repository.findSmartFurnitureHookupByID(
      validHookupID("sfh-ev"),
    );
    if (!sfh) return;
    sfh.assignToZone(validZoneID("zone-ev"));

    await uow.executeTransactionally(async () => {
      await repository.updateSmartFurnitureHookup(sfh);
      for (const event of sfh.pullDomainEvents()) {
        await eventPublisher.publish(event);
      }
    });

    const [doc] = await findAllOutboxEvents();
    expect(doc.eventType).toBe("SmartFurnitureHookupZoneChangedEvent");
    expect(doc.aggregateId).toBeDefined();
    expect(doc.occurredAt).toBeDefined();
    expect(doc.payload).toMatchObject({
      smartFurnitureHookupId: "sfh-ev",
      zoneId: "zone-ev",
    });
  });

  it("publishes ZoneDeletedEvent with correct payload shape", async () => {
    await seedZone("zone-ev2", "Event Test Zone");
    const zone = await repository.findZoneByID(validZoneID("zone-ev2"));
    if (!zone) return;
    zone.prepareForDeletion();

    await uow.executeTransactionally(async () => {
      await repository.removeZone(zone.id);
      for (const event of zone.pullDomainEvents()) {
        await eventPublisher.publish(event);
      }
    });

    const [doc] = await findAllOutboxEvents();
    expect(doc.eventType).toBe("ZoneDeletedEvent");
    expect(doc.aggregateType).toBe("HouseMap");
    expect(doc.payload).toMatchObject({ zoneId: "zone-ev2" });
  });
});
