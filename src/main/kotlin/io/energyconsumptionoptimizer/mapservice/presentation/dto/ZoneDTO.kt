package io.energyconsumptionoptimizer.mapservice.presentation.dto

import kotlinx.serialization.Serializable

@Serializable
data class ZoneDTO(
    val id: String,
    val name: String,
    val color: String,
    val vertices: List<PointDTO>,
)
