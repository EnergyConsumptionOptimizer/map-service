import { beforeEach, describe, expect, it } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { StatusCodes } from "http-status-codes";
import { ZoneController } from "@presentation/rest/controllers/ZoneController";
import type { ZoneService } from "@application/inbound/ZoneService";
import {
  InvalidColorError,
  InvalidPolygonError,
  ZoneNotFoundError,
  ZoneNameEmptyError,
} from "@domain/errors";
import { mockRequest } from "@test/unit/presentation/mockRequest";
import { mockResponse } from "@test/unit/presentation/mockResponse";
import {
  mockLivingRoom,
  mockKitchen,
  mockBedroom,
} from "@test/unit/presentation/controllers/mockData";
import { zoneDTOMapper } from "@presentation/ZoneDTO";

// Request body helpers
const validCreateBody = {
  name: "Living Room",
  color: "#FF8800",
  vertices: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ],
};

describe("ZoneController", () => {
  let zoneService: MockProxy<ZoneService>;
  let controller: ZoneController;

  beforeEach(() => {
    zoneService = mock<ZoneService>();
    controller = new ZoneController(zoneService);
  });

  describe("createZone()", () => {
    it("should return 201 and the zone DTO on success", async () => {
      zoneService.createZone.mockResolvedValue(mockLivingRoom);
      const req = mockRequest({ body: validCreateBody });
      const res = mockResponse();

      await controller.createZone(req, res);

      expect(zoneService.createZone).toHaveBeenCalledWith(
        validCreateBody.name,
        validCreateBody.color,
        validCreateBody.vertices.map((v) => [v.x, v.y]),
      );
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        zoneDTOMapper.toDTO(mockLivingRoom),
      );
    });

    it("should throw when the service returns InvalidColorError", async () => {
      zoneService.createZone.mockResolvedValue(new InvalidColorError("bad"));
      const req = mockRequest({ body: { ...validCreateBody, color: "bad" } });
      const res = mockResponse();

      await expect(controller.createZone(req, res)).rejects.toThrow(
        InvalidColorError,
      );
    });

    it("should throw when the service returns ZoneNameEmptyError", async () => {
      zoneService.createZone.mockResolvedValue(new ZoneNameEmptyError());
      const req = mockRequest({ body: { ...validCreateBody, name: "" } });
      const res = mockResponse();

      await expect(controller.createZone(req, res)).rejects.toThrow(
        ZoneNameEmptyError,
      );
    });

    it("should throw when the service returns InvalidPolygonError", async () => {
      zoneService.createZone.mockResolvedValue(new InvalidPolygonError());
      const req = mockRequest({
        body: { ...validCreateBody, vertices: [{ x: 0, y: 0 }] },
      });
      const res = mockResponse();

      await expect(controller.createZone(req, res)).rejects.toThrow(
        InvalidPolygonError,
      );
    });
  });

  describe("getZones()", () => {
    it("should return 200 with all zones wrapped in a zones array", async () => {
      const zones = [mockLivingRoom, mockKitchen];
      zoneService.getZones.mockResolvedValue(zones);
      const req = mockRequest();
      const res = mockResponse();

      await controller.getZones(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        zones: zones.map(zoneDTOMapper.toDTO),
      });
    });

    it("should return an empty zones array when no zones exist", async () => {
      zoneService.getZones.mockResolvedValue([]);
      const req = mockRequest();
      const res = mockResponse();

      await controller.getZones(req, res);

      expect(res.json).toHaveBeenCalledWith({ zones: [] });
    });
  });

  describe("getZone()", () => {
    it("should return 200 and the zone DTO when found", async () => {
      zoneService.getZone.mockResolvedValue(mockLivingRoom);
      const req = mockRequest({ params: { id: "zone-living-room" } });
      const res = mockResponse();

      await controller.getZone(req, res);

      expect(zoneService.getZone).toHaveBeenCalledWith("zone-living-room");
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(
        zoneDTOMapper.toDTO(mockLivingRoom),
      );
    });

    it("should throw ZoneNotFoundError when the zone does not exist", async () => {
      zoneService.getZone.mockResolvedValue(null);
      const req = mockRequest({ params: { id: "unknown-zone" } });
      const res = mockResponse();

      await expect(controller.getZone(req, res)).rejects.toThrow(
        ZoneNotFoundError,
      );
    });
  });

  describe("updateZone()", () => {
    it("should return 200 and the updated zone DTO on success", async () => {
      zoneService.updateZone.mockResolvedValue(mockBedroom);
      const req = mockRequest({
        params: { id: "zone-bedroom" },
        body: { name: "Bedroom", color: "#4466FF" },
      });
      const res = mockResponse();

      await controller.updateZone(req, res);

      expect(zoneService.updateZone).toHaveBeenCalledWith(
        "zone-bedroom",
        "Bedroom",
        "#4466FF",
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(zoneDTOMapper.toDTO(mockBedroom));
    });

    it("should pass vertices when provided and convert them to tuples", async () => {
      const newVertices = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
      ];
      zoneService.updateZone.mockResolvedValue(mockBedroom);
      const req = mockRequest({
        params: { id: "zone-bedroom" },
        body: { vertices: newVertices },
      });
      const res = mockResponse();

      await controller.updateZone(req, res);

      expect(zoneService.updateZone).toHaveBeenCalledWith(
        "zone-bedroom",
        undefined,
        undefined,
        newVertices.map((v) => [v.x, v.y]),
      );
    });

    it("should throw ZoneNotFoundError when updating a non-existing zone", async () => {
      zoneService.updateZone.mockResolvedValue(
        new ZoneNotFoundError("missing"),
      );
      const req = mockRequest({
        params: { id: "missing" },
        body: { name: "New Name" },
      });
      const res = mockResponse();

      await expect(controller.updateZone(req, res)).rejects.toThrow(
        ZoneNotFoundError,
      );
    });
  });

  describe("deleteZone()", () => {
    it("should return 204 on successful deletion", async () => {
      zoneService.deleteZone.mockResolvedValue(undefined);
      const req = mockRequest({ params: { id: "zone-living-room" } });
      const res = mockResponse();

      await controller.deleteZone(req, res);

      expect(zoneService.deleteZone).toHaveBeenCalledWith("zone-living-room");
      expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
    });

    it("should throw ZoneNotFoundError when deleting a non-existing zone", async () => {
      zoneService.deleteZone.mockResolvedValue(
        new ZoneNotFoundError("missing"),
      );
      const req = mockRequest({ params: { id: "missing" } });
      const res = mockResponse();

      await expect(controller.deleteZone(req, res)).rejects.toThrow(
        ZoneNotFoundError,
      );
    });
  });
});
