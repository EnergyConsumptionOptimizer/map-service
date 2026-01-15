package io.energyconsumptionoptimizer.mapservice.presentation.dto

import kotlinx.serialization.Serializable

@Serializable
data class ZonesDTO(
    val zones: List<ZoneDTO>,
)
