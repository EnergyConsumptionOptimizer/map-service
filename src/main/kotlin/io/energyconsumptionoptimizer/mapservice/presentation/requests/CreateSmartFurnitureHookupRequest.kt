package io.energyconsumptionoptimizer.mapservice.presentation.requests

import io.energyconsumptionoptimizer.mapservice.presentation.dto.PointDTO
import kotlinx.serialization.Serializable

@Serializable
data class CreateSmartFurnitureHookupRequest(
    val id: String,
    val position: PointDTO,
    val zoneID: String? = null,
)
