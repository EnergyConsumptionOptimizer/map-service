import type { HouseMapRepository } from "@domain/ports/HouseMapRepository";
import type { FloorPlanService } from "@application/inbound/FloorPlanService";
import { FloorPlan } from "@domain/values/FloorPlan";
import { InvalidFloorPlanError } from "@domain/errors";
import { BusinessMetrics } from "@application/outbound/BusinessMetrics";

const SVG_ROOT_TAG = /<svg[\s>]/i;

export class FloorPlanServiceImpl implements FloorPlanService {
  readonly #repository: HouseMapRepository;
  readonly #metrics: BusinessMetrics;

  constructor(repository: HouseMapRepository, metrics: BusinessMetrics) {
    this.#repository = repository;
    this.#metrics = metrics;
  }

  async createFloorPlan(floorPlanSVG: string): Promise<FloorPlan | Error> {
    if (!this.#isValidSVG(floorPlanSVG)) {
      return new InvalidFloorPlanError();
    }

    const floorPlan = FloorPlan.from(floorPlanSVG);
    if (floorPlan instanceof Error) return floorPlan;

    await this.#repository.saveFloorPlan(floorPlan);

    this.#metrics.recordFloorPlanCreation();

    return floorPlan;
  }

  async getFloorPlan(): Promise<FloorPlan | null> {
    return this.#repository.findFloorPlan();
  }

  /**
   * Validates that the SVG string has a root <svg> element.
   * We use a lightweight regex check to avoid pulling in an XML parser.
   */
  #isValidSVG(svg: string): boolean {
    return SVG_ROOT_TAG.test(svg.trimStart());
  }
}
