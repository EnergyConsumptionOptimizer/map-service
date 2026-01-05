package io.energyconsumptionoptimizer.mapservice.domain.ports

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan

/**
 * Service interface for managing floor plan operations.
 *
 */
interface FloorPlanService {
    /**
     * Creates a new floor plan from an SVG representation.
     *
     * @param floorPlanSVG The SVG string representing the house floor plan layout
     * @return The created floor plan entity
     *
     * @throws io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanFormatNotValidException
     */
    suspend fun createFloorPlan(floorPlanSVG: String): FloorPlan

    /**
     * Retrieves the current floor plan.
     *
     * @return The floor plan if it exists, null otherwise
     */
    suspend fun getFloorPlan(): FloorPlan?
}
