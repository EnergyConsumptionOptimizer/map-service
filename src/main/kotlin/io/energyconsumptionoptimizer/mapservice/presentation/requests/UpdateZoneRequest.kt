package io.energyconsumptionoptimizer.mapservice.presentation.requests

import io.energyconsumptionoptimizer.mapservice.presentation.dto.PointDTO
import kotlinx.serialization.Serializable

@Serializable
data class UpdateZoneRequest(
    val name: String? = null,
    val color: String? = null,
    val vertices: List<PointDTO>? = null,
)

fun UpdateZoneRequest.isEmpty(): Boolean = name == null && color == null && vertices == null
