package io.energyconsumptionoptimizer.mapservice.application.port

import io.energyconsumptionoptimizer.mapservice.domain.ZoneID

/**
 * Service interface for managing monitoring service operations.
 *
 */
interface MonitoringService {
    /**
     * Sends a request to the monitoring service to remove the given zone ID tag
     * from all measurements associated with it.
     *
     *
     * @param zoneID the identifier of the zone to be removed from all measurements
     */
    suspend fun removeZoneIDFromMeasurements(zoneID: ZoneID)
}
