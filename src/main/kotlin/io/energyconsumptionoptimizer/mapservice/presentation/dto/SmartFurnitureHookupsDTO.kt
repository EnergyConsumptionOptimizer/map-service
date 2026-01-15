package io.energyconsumptionoptimizer.mapservice.presentation.dto

import kotlinx.serialization.Serializable

@Serializable
data class SmartFurnitureHookupsDTO(
    val smartFurnitureHookups: List<SmartFurnitureHookupDTO>,
)
