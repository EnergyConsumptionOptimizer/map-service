package io.energyconsumptionoptimizer.mapservice.presentation.dto

import kotlinx.serialization.Serializable

@Serializable
data class HouseMapDTO(
    val floorPlan: FloorPlanDTO,
    val zones: List<ZoneDTO> = emptyList(),
    val smartFurnitureHookups: List<SmartFurnitureHookupDTO> = emptyList(),
)
