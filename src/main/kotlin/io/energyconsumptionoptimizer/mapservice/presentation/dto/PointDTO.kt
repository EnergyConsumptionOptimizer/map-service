package io.energyconsumptionoptimizer.mapservice.presentation.dto

import kotlinx.serialization.Serializable

@Serializable
data class PointDTO(
    val x: Double,
    val y: Double,
)
