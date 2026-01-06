package io.energyconsumptionoptimizer.mapservice.presentation.requests

import io.energyconsumptionoptimizer.mapservice.presentation.dto.PointDTO
import kotlinx.serialization.Serializable

@Serializable
data class UpdateSmartFurnitureHookupRequest(
    val position: PointDTO? = null,
    val zoneID: String? = null,
)

fun UpdateSmartFurnitureHookupRequest.isEmpty(): Boolean = position == null && zoneID == null
