package io.energyconsumptionoptimizer.mapservice.presentation.dto

import kotlinx.serialization.Serializable

@Serializable
data class SmartFurnitureHookupDTO(
    val id: String,
    val position: PointDTO,
    val zoneID: String?,
)
