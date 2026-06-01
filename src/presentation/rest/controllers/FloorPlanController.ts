import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { FloorPlanService } from "@application/inbound/FloorPlanService";
import { FloorPlanNotFoundError } from "@domain/errors";
import { floorPlanDTOMapper } from "@presentation/FloorPlanDTO";

export class FloorPlanController {
  readonly #floorPlanService: FloorPlanService;

  constructor(floorPlanService: FloorPlanService) {
    this.#floorPlanService = floorPlanService;
  }

  async createFloorPlan(req: Request, res: Response): Promise<void> {
    const { svgContent } = req.body as { svgContent: string };

    const result = await this.#floorPlanService.createFloorPlan(svgContent);

    if (result instanceof Error) throw result;

    res.status(StatusCodes.CREATED).json(floorPlanDTOMapper.toDTO(result));
  }

  async getFloorPlan(_req: Request, res: Response): Promise<void> {
    const floorPlan = await this.#floorPlanService.getFloorPlan();

    if (!floorPlan) throw new FloorPlanNotFoundError();

    res.status(StatusCodes.OK).json(floorPlanDTOMapper.toDTO(floorPlan));
  }
}
