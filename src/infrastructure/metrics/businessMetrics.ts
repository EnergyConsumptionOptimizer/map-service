import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("map-service");

export const floorPlanCreationsTotal = meter.createCounter(
  "floor_plan_creations_total",
  { description: "Total number of floor plan creations" },
);

export const zoneCreationsTotal = meter.createCounter("zone_creations_total", {
  description: "Total number of zone creations",
});

export const zoneUpdatesTotal = meter.createCounter("zone_updates_total", {
  description: "Total number of zone updates",
});

export const zoneDeletionsTotal = meter.createCounter("zone_deletions_total", {
  description: "Total number of zone deletions",
});

export const hookupCreationsTotal = meter.createCounter(
  "smart_furniture_hookup_creations_total",
  { description: "Total number of smart furniture hookup creations" },
);

export const hookupUpdatesTotal = meter.createCounter(
  "smart_furniture_hookup_updates_total",
  { description: "Total number of smart furniture hookup updates" },
);

export const hookupDeletionsTotal = meter.createCounter(
  "smart_furniture_hookup_deletions_total",
  { description: "Total number of smart furniture hookup deletions" },
);
