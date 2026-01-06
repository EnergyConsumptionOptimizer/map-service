package io.energyconsumptionoptimizer.mapservice.domain.ports

import io.energyconsumptionoptimizer.mapservice.domain.HouseMap

/**
 * Service interface for retrieving the complete house map.
 */
interface HouseMapService {
    /**
     * Retrieves the complete house map including floor plan, zones, and smart furniture hookups.
     *
     * This method aggregates all spatial data into a single cohesive representation of the house.
     *
     * @return The complete house map with all its components
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanNotFoundException
     */
    suspend fun getHouseMap(): HouseMap
}
