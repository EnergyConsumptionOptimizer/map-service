import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { SmartFurnitureHookupService } from "@application/inbound/SmartFurnitureHookupService";
import { smartFurnitureHookupDTOMapper } from "@presentation/SmartFurnitureHookupDTO";

export class SmartFurnitureHookupController {
  readonly #smartFurnitureHookupService: SmartFurnitureHookupService;

  constructor(smartFurnitureHookupService: SmartFurnitureHookupService) {
    this.#smartFurnitureHookupService = smartFurnitureHookupService;
  }

  async getSmartFurnitureHookups(_req: Request, res: Response): Promise<void> {
    const hookups =
      await this.#smartFurnitureHookupService.getSmartFurnitureHookups();

    res.status(StatusCodes.OK).json({
      smartFurnitureHookups: hookups.map(smartFurnitureHookupDTOMapper.toDTO),
    });
  }

  async getSmartFurnitureHookup(req: Request, res: Response): Promise<void> {
    const result =
      await this.#smartFurnitureHookupService.getSmartFurnitureHookup(
        req.params.id as string,
      );

    if (result instanceof Error) throw result;

    res
      .status(StatusCodes.OK)
      .json(smartFurnitureHookupDTOMapper.toDTO(result));
  }

  async updateSmartFurnitureHookup(req: Request, res: Response): Promise<void> {
    const { position, zoneId } = req.body as {
      position?: { x: number; y: number };
      zoneId?: string;
    };

    const result =
      await this.#smartFurnitureHookupService.updateSmartFurnitureHookup(
        req.params.id as string,
        position ? [position.x, position.y] : undefined,
        zoneId,
      );

    if (result instanceof Error) throw result;

    res
      .status(StatusCodes.OK)
      .json(smartFurnitureHookupDTOMapper.toDTO(result));
  }

  async deleteSmartFurnitureHookup(req: Request, res: Response): Promise<void> {
    const result =
      await this.#smartFurnitureHookupService.deleteSmartFurnitureHookup(
        req.params.id as string,
      );

    if (result instanceof Error) throw result;

    res.sendStatus(StatusCodes.NO_CONTENT);
  }
}
