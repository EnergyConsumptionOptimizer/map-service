import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  type ComponentTestContext,
  clearDatabase,
  composeAppForComponentTest,
  startMongo,
  stopMongo,
} from "./setup";

const ADMIN = {
  "X-User-Id": "admin-id",
  "X-User-Role": "ADMIN",
  "X-User-Username": "admin",
};

const HOUSEHOLD = {
  "X-User-Id": "user-1",
  "X-User-Role": "HOUSEHOLD",
  "X-User-Username": "testuser",
};

const UNKNOWN_ID = "non-existent-id";

const VALID_SVG = "<svg xmlns='http://www.w3.org/2000/svg'><rect/></svg>";

const UNIT_SQUARE_VERTICES = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

const DISTANT_VERTICES = [
  { x: 100, y: 100 },
  { x: 110, y: 100 },
  { x: 110, y: 110 },
  { x: 100, y: 110 },
];

async function uploadFloorPlan(app: ComponentTestContext["app"]) {
  return request(app)
    .post("/api/floor-plan")
    .set(ADMIN)
    .send({ svgContent: VALID_SVG });
}

async function createZone(
  app: ComponentTestContext["app"],
  name = "Living Room",
  color = "#FF8800",
  vertices = UNIT_SQUARE_VERTICES,
) {
  return request(app)
    .post("/api/zones")
    .set(ADMIN)
    .send({ name, color, vertices });
}

describe("House Map Component", () => {
  let ctx: ComponentTestContext;

  beforeAll(startMongo);
  afterAll(stopMongo);

  beforeEach(async () => {
    await clearDatabase();
    ctx = await composeAppForComponentTest();
  });

  describe("Feature: Health check", () => {
    it("When GET /health, Then returns 200 with status ok", async () => {
      const res = await request(ctx.app).get("/health");
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("Feature: Floor plan management", () => {
    describe("Scenario: Upload floor plan", () => {
      it("Given valid SVG, When admin uploads, Then returns 201 with svgContent", async () => {
        const res = await uploadFloorPlan(ctx.app);

        expect(res.status).toBe(StatusCodes.CREATED);
        expect(res.body).toMatchObject({ svgContent: VALID_SVG });
      });

      it("Given invalid SVG (not SVG markup), When admin uploads, Then returns 422", async () => {
        const res = await request(ctx.app)
          .post("/api/floor-plan")
          .set(ADMIN)
          .send({ svgContent: "<html><body/></html>" });

        expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body.code).toBe("INVALID_FLOOR_PLAN");
      });

      it("Given missing svgContent, When admin uploads, Then returns 400", async () => {
        const res = await request(ctx.app)
          .post("/api/floor-plan")
          .set(ADMIN)
          .send({});

        expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      });

      it("Given non-admin user, When uploads, Then returns 403", async () => {
        const res = await request(ctx.app)
          .post("/api/floor-plan")
          .set(HOUSEHOLD)
          .send({ svgContent: VALID_SVG });

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
        expect(res.body.code).toBe("FORBIDDEN");
      });

      it("Given no auth headers, When uploads, Then returns 401", async () => {
        const res = await request(ctx.app)
          .post("/api/floor-plan")
          .send({ svgContent: VALID_SVG });

        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });

      it("Given second upload, When admin uploads again, Then replaces the existing plan (upsert)", async () => {
        await uploadFloorPlan(ctx.app);

        const newSvg = "<svg><circle r='5'/></svg>";
        await request(ctx.app)
          .post("/api/floor-plan")
          .set(ADMIN)
          .send({ svgContent: newSvg });

        const res = await request(ctx.app).get("/api/floor-plan").set(ADMIN);
        expect(res.body.svgContent).toBe(newSvg);
      });
    });

    describe("Scenario: Get floor plan", () => {
      it("Given an uploaded floor plan, When requested, Then returns 200 with svgContent", async () => {
        await uploadFloorPlan(ctx.app);

        const res = await request(ctx.app).get("/api/floor-plan").set(ADMIN);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.svgContent).toBe(VALID_SVG);
      });

      it("Given no floor plan uploaded, When requested, Then returns 404", async () => {
        const res = await request(ctx.app).get("/api/floor-plan").set(ADMIN);

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
        expect(res.body.code).toBe("NOT_FOUND");
      });

      it("Given no auth headers, When requested, Then returns 401", async () => {
        const res = await request(ctx.app).get("/api/floor-plan");
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });
  });

  describe("Feature: Zone management", () => {
    describe("Scenario: Create zone", () => {
      it("Given valid data, When admin creates, Then returns 201 with id and shape", async () => {
        const res = await createZone(ctx.app);

        expect(res.status).toBe(StatusCodes.CREATED);
        expect(res.body).toMatchObject({
          id: expect.any(String) as string,
          name: "Living Room",
          color: "#FF8800",
          vertices: expect.arrayContaining([{ x: 0, y: 0 }]) as unknown[],
        });
      });

      it("Given duplicate zone name, When admin creates, Then returns 409", async () => {
        await createZone(ctx.app, "Living Room");

        const res = await createZone(ctx.app, "Living Room", "#00AABB");

        expect(res.status).toBe(StatusCodes.CONFLICT);
        expect(res.body.code).toBe("UNIQUE_FIELD_ALREADY_EXISTS");
      });

      it("Given invalid color, When admin creates, Then returns 400", async () => {
        const res = await request(ctx.app).post("/api/zones").set(ADMIN).send({
          name: "Bad Zone",
          color: "not-a-hex",
          vertices: UNIT_SQUARE_VERTICES,
        });

        expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        expect(res.body.code).toBe("INVALID_COLOR");
      });

      it("Given fewer than 3 vertices, When admin creates, Then returns 400", async () => {
        const res = await request(ctx.app)
          .post("/api/zones")
          .set(ADMIN)
          .send({
            name: "Bad Zone",
            color: "#FF0000",
            vertices: [
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ],
          });

        expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      });

      it("Given non-admin user, When creates, Then returns 403", async () => {
        const res = await request(ctx.app)
          .post("/api/zones")
          .set(HOUSEHOLD)
          .send({
            name: "Zone",
            color: "#FF8800",
            vertices: UNIT_SQUARE_VERTICES,
          });

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
      });

      it("Given no auth headers, When creates, Then returns 401", async () => {
        const res = await request(ctx.app).post("/api/zones").send({
          name: "Zone",
          color: "#FF8800",
          vertices: UNIT_SQUARE_VERTICES,
        });

        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });

    describe("Scenario: List zones", () => {
      it("Given existing zones, When listed, Then returns 200 with all zones", async () => {
        await createZone(ctx.app, "Kitchen", "#00AA44");
        await createZone(ctx.app, "Bedroom", "#4466FF", DISTANT_VERTICES);

        const res = await request(ctx.app).get("/api/zones").set(ADMIN);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.zones).toHaveLength(2);
      });

      it("Given no zones, When listed, Then returns 200 with empty array", async () => {
        const res = await request(ctx.app).get("/api/zones").set(HOUSEHOLD);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.zones).toEqual([]);
      });

      it("Given no auth headers, When listed, Then returns 401", async () => {
        const res = await request(ctx.app).get("/api/zones");
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });

    describe("Scenario: Get zone by ID", () => {
      it("Given existing zone, When get by ID, Then returns 200 with zone details", async () => {
        const createRes = await createZone(ctx.app, "Bathroom");
        const zoneId = createRes.body.id as string;

        const res = await request(ctx.app)
          .get(`/api/zones/${zoneId}`)
          .set(HOUSEHOLD);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body).toMatchObject({ id: zoneId, name: "Bathroom" });
      });

      it("Given unknown ID, When get by ID, Then returns 404", async () => {
        const res = await request(ctx.app)
          .get(`/api/zones/${UNKNOWN_ID}`)
          .set(ADMIN);

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
        expect(res.body.code).toBe("NOT_FOUND");
      });

      it("Given no auth headers, When get by ID, Then returns 401", async () => {
        const res = await request(ctx.app).get(`/api/zones/${UNKNOWN_ID}`);
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });

    describe("Scenario: Update zone", () => {
      it("Given existing zone, When admin renames, Then returns 200 with new name", async () => {
        const { body: created } = await createZone(ctx.app, "Old Name");

        const res = await request(ctx.app)
          .patch(`/api/zones/${created.id}`)
          .set(ADMIN)
          .send({ name: "New Name" });

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.name).toBe("New Name");
        expect(res.body.color).toBe("#FF8800");
      });

      it("Given existing zone, When admin recolors, Then returns 200 with new color", async () => {
        const { body: created } = await createZone(ctx.app);

        const res = await request(ctx.app)
          .patch(`/api/zones/${created.id}`)
          .set(ADMIN)
          .send({ color: "#123456" });

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.color).toBe("#123456");
      });

      it("Given existing zone, When admin reshapes, Then returns 200 with new vertices", async () => {
        const { body: created } = await createZone(ctx.app);

        const res = await request(ctx.app)
          .patch(`/api/zones/${created.id}`)
          .set(ADMIN)
          .send({ vertices: DISTANT_VERTICES });

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.vertices).toHaveLength(4);
        expect(res.body.vertices[0]).toMatchObject({ x: 100, y: 100 });
      });

      it("Given update to duplicate name, When admin updates, Then returns 409", async () => {
        await createZone(ctx.app, "Taken");
        const { body: other } = await createZone(
          ctx.app,
          "Other",
          "#00AABB",
          DISTANT_VERTICES,
        );

        const res = await request(ctx.app)
          .patch(`/api/zones/${other.id}`)
          .set(ADMIN)
          .send({ name: "Taken" });

        expect(res.status).toBe(StatusCodes.CONFLICT);
      });

      it("Given unknown ID, When admin updates, Then returns 404", async () => {
        const res = await request(ctx.app)
          .patch(`/api/zones/${UNKNOWN_ID}`)
          .set(ADMIN)
          .send({ name: "Ghost" });

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
      });

      it("Given non-admin user, When updates, Then returns 403", async () => {
        const { body: created } = await createZone(ctx.app);

        const res = await request(ctx.app)
          .patch(`/api/zones/${created.id}`)
          .set(HOUSEHOLD)
          .send({ name: "Hacked" });

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
      });

      it("Given no auth headers, When updates, Then returns 401", async () => {
        const res = await request(ctx.app)
          .patch(`/api/zones/${UNKNOWN_ID}`)
          .send({ name: "Ghost" });
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });

    describe("Scenario: Delete zone", () => {
      it("Given existing zone, When admin deletes, Then returns 204 and subsequent GET returns 404", async () => {
        const { body: created } = await createZone(ctx.app);

        const deleteRes = await request(ctx.app)
          .delete(`/api/zones/${created.id}`)
          .set(ADMIN);

        expect(deleteRes.status).toBe(StatusCodes.NO_CONTENT);

        const getRes = await request(ctx.app)
          .get(`/api/zones/${created.id}`)
          .set(ADMIN);
        expect(getRes.status).toBe(StatusCodes.NOT_FOUND);
      });

      it("Given unknown ID, When admin deletes, Then returns 404", async () => {
        const res = await request(ctx.app)
          .delete(`/api/zones/${UNKNOWN_ID}`)
          .set(ADMIN);

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
      });

      it("Given non-admin user, When deletes, Then returns 403", async () => {
        const { body: created } = await createZone(ctx.app);

        const res = await request(ctx.app)
          .delete(`/api/zones/${created.id}`)
          .set(HOUSEHOLD);

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
      });

      it("Given no auth headers, When deletes, Then returns 401", async () => {
        const res = await request(ctx.app).delete(`/api/zones/${UNKNOWN_ID}`);
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });
  });

  describe("Feature: Smart furniture hookup placement", () => {
    describe("Scenario: List hookups", () => {
      it("Given no hookups, When listed, Then returns 200 with empty array", async () => {
        const res = await request(ctx.app)
          .get("/api/smart-furniture-hookups")
          .set(HOUSEHOLD);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.smartFurnitureHookups).toEqual([]);
      });

      it("Given existing hookup (created via update), When listed, Then returns 200 with it", async () => {
        // updateSmartFurnitureHookup auto-creates the hookup if the port confirms it exists
        await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-1")
          .set(ADMIN)
          .send({ position: { x: 5, y: 5 } });

        const res = await request(ctx.app)
          .get("/api/smart-furniture-hookups")
          .set(HOUSEHOLD);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.smartFurnitureHookups).toHaveLength(1);
      });

      it("Given no auth headers, When listed, Then returns 401", async () => {
        const res = await request(ctx.app).get("/api/smart-furniture-hookups");
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });

    describe("Scenario: Get hookup by ID", () => {
      it("Given existing hookup, When get by ID, Then returns 200 with position and zoneId", async () => {
        await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-desk")
          .set(ADMIN)
          .send({ position: { x: 3, y: 7 } });

        const res = await request(ctx.app)
          .get("/api/smart-furniture-hookups/sfh-desk")
          .set(HOUSEHOLD);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body).toMatchObject({
          id: "sfh-desk",
          position: { x: 3, y: 7 },
        });
      });

      it("Given unknown ID, When get by ID, Then returns 404", async () => {
        const res = await request(ctx.app)
          .get(`/api/smart-furniture-hookups/${UNKNOWN_ID}`)
          .set(ADMIN);

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
      });

      it("Given no auth headers, When get by ID, Then returns 401", async () => {
        const res = await request(ctx.app).get(
          `/api/smart-furniture-hookups/${UNKNOWN_ID}`,
        );
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });

    describe("Scenario: Update hookup position", () => {
      it("Given valid position, When admin updates, Then returns 200 with new position", async () => {
        const res = await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-1")
          .set(ADMIN)
          .send({ position: { x: 4, y: 6 } });

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.position).toMatchObject({ x: 4, y: 6 });
      });

      it("Given a zone and hookup inside it, When admin updates position to inside zone, Then hookup is auto-assigned", async () => {
        const { body: zone } = await createZone(ctx.app, "Zone A");

        const res = await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-in-zone")
          .set(ADMIN)
          .send({ position: { x: 5, y: 5 } }); // inside unit square (0,0)-(10,10)

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.zoneId).toBe(zone.id);
      });

      it("Given a zone and hookup outside it, When admin updates position outside all zones, Then hookup zoneId is null", async () => {
        await createZone(ctx.app, "Zone A");

        const res = await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-far")
          .set(ADMIN)
          .send({ position: { x: 200, y: 200 } }); // outside any zone

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.zoneId).toBeNull();
      });

      it("Given valid zoneId, When admin assigns hookup to zone, Then returns 200", async () => {
        const { body: zone } = await createZone(ctx.app, "Zone B");

        const res = await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-assign")
          .set(ADMIN)
          .send({ position: { x: 5, y: 5 }, zoneId: zone.id });

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.zoneId).toBe(zone.id);
      });

      it("Given unknown zoneId, When admin assigns, Then returns 404", async () => {
        const res = await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-1")
          .set(ADMIN)
          .send({ zoneId: "non-existent-zone" });

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
      });

      it("Given non-admin user, When updates, Then returns 403", async () => {
        const res = await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-1")
          .set(HOUSEHOLD)
          .send({ position: { x: 1, y: 1 } });

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
      });

      it("Given no auth headers, When updates, Then returns 401", async () => {
        const res = await request(ctx.app)
          .patch("/api/smart-furniture-hookups/sfh-1")
          .send({ position: { x: 1, y: 1 } });
        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      });
    });
  });

  describe("Feature: House map retrieval", () => {
    it("Given floor plan and zones and hookups, When requested, Then returns assembled map", async () => {
      await uploadFloorPlan(ctx.app);
      await createZone(ctx.app, "Living Room");
      await request(ctx.app)
        .patch("/api/smart-furniture-hookups/sfh-1")
        .set(ADMIN)
        .send({ position: { x: 5, y: 5 } });

      const res = await request(ctx.app).get("/api/house-map").set(HOUSEHOLD);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.floorPlan.svgContent).toBe(VALID_SVG);
      expect(res.body.zones).toHaveLength(1);
      expect(res.body.smartFurnitureHookups).toHaveLength(1);
    });

    it("Given no floor plan, When requested, Then returns 404", async () => {
      const res = await request(ctx.app).get("/api/house-map").set(HOUSEHOLD);

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("Given no auth headers, When requested, Then returns 401", async () => {
      const res = await request(ctx.app).get("/api/house-map");
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });
  });

  describe("Feature: Internal hookup lookup", () => {
    it("Given existing hookup, When GET /api/internal/smart-furniture-hookups/:id, Then returns 200", async () => {
      await request(ctx.app)
        .patch("/api/smart-furniture-hookups/sfh-internal")
        .set(ADMIN)
        .send({ position: { x: 2, y: 3 } });

      const res = await request(ctx.app).get(
        "/api/internal/smart-furniture-hookups/sfh-internal",
      );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toMatchObject({ id: "sfh-internal" });
    });

    it("Given unknown hookup, When GET /api/internal/smart-furniture-hookups/:id, Then returns 404", async () => {
      const res = await request(ctx.app).get(
        `/api/internal/smart-furniture-hookups/${UNKNOWN_ID}`,
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });
  });
});
