import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ZoneService } from "@application/inbound/ZoneService";
import { ZoneNotFoundError } from "@domain/errors";
import { zoneDTOMapper } from "@presentation/ZoneDTO";

export class ZoneController {
  readonly #zoneService: ZoneService;

  constructor(zoneService: ZoneService) {
    this.#zoneService = zoneService;
  }

  async createZone(req: Request, res: Response): Promise<void> {
    const { name, color, vertices } = req.body as {
      name: string;
      color: string;
      vertices: { x: number; y: number }[];
    };

    const result = await this.#zoneService.createZone(
      name,
      color,
      vertices.map((v) => [v.x, v.y]),
    );

    if (result instanceof Error) throw result;

    res.status(StatusCodes.CREATED).json(zoneDTOMapper.toDTO(result));
  }

  async getZones(_req: Request, res: Response): Promise<void> {
    const zones = await this.#zoneService.getZones();

    res.status(StatusCodes.OK).json({
      zones: zones.map(zoneDTOMapper.toDTO),
    });
  }

  async getZone(req: Request, res: Response): Promise<void> {
    const zone = await this.#zoneService.getZone(req.params.id as string);

    if (!zone) throw new ZoneNotFoundError(req.params.id as string);

    res.status(StatusCodes.OK).json(zoneDTOMapper.toDTO(zone));
  }

  async updateZone(req: Request, res: Response): Promise<void> {
    const { name, color, vertices } = req.body as {
      name?: string;
      color?: string;
      vertices?: { x: number; y: number }[];
    };

    const result = await this.#zoneService.updateZone(
      req.params.id as string,
      name,
      color,
      vertices?.map((v) => [v.x, v.y]),
    );

    if (result instanceof Error) throw result;

    res.status(StatusCodes.OK).json(zoneDTOMapper.toDTO(result));
  }

  async deleteZone(req: Request, res: Response): Promise<void> {
    const result = await this.#zoneService.deleteZone(req.params.id as string);

    if (result instanceof Error) throw result;

    res.sendStatus(StatusCodes.NO_CONTENT);
  }
}
