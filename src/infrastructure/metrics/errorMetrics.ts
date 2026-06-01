import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("map-service");

export const mapErrorsTotal = meter.createCounter("map_errors_total", {
  description: "Total number of errors in map service",
});
