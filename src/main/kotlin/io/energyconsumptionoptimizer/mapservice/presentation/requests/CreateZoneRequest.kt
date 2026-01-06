package io.energyconsumptionoptimizer.mapservice.presentation.requests

import io.energyconsumptionoptimizer.mapservice.presentation.dto.PointDTO
import kotlinx.serialization.Serializable

@Serializable
data class CreateZoneRequest(
    val name: String,
    val color: String,
    val vertices: List<PointDTO>,
)
