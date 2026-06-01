import type { BusinessMetrics } from "@application/outbound/BusinessMetrics";
import {
  floorPlanCreationsTotal,
  zoneCreationsTotal,
  zoneUpdatesTotal,
  zoneDeletionsTotal,
  hookupCreationsTotal,
  hookupUpdatesTotal,
  hookupDeletionsTotal,
} from "./businessMetrics";

export class OtelBusinessMetrics implements BusinessMetrics {
  recordFloorPlanCreation(): void {
    floorPlanCreationsTotal.add(1);
  }

  recordZoneCreation(): void {
    zoneCreationsTotal.add(1);
  }

  recordZoneUpdate(): void {
    zoneUpdatesTotal.add(1);
  }

  recordZoneDeletion(): void {
    zoneDeletionsTotal.add(1);
  }

  recordSmartFurnitureHookupCreation(): void {
    hookupCreationsTotal.add(1);
  }

  recordSmartFurnitureHookupUpdate(): void {
    hookupUpdatesTotal.add(1);
  }

  recordSmartFurnitureHookupDeletion(): void {
    hookupDeletionsTotal.add(1);
  }
}
