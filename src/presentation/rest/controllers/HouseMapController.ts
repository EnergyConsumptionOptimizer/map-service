import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { HouseMapService } from "@application/inbound/HouseMapService";
import { houseMapDTOMapper } from "@presentation/HouseMapDTO";

export class HouseMapController {
  readonly #houseMapService: HouseMapService;

  constructor(houseMapService: HouseMapService) {
    this.#houseMapService = houseMapService;
  }

  async getHouseMap(_req: Request, res: Response): Promise<void> {
    const result = await this.#houseMapService.getHouseMap();

    if (result instanceof Error) throw result;

    res.status(StatusCodes.OK).json(houseMapDTOMapper.toDTO(result));
  }
}
