package io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents

import kotlinx.serialization.Serializable

@Serializable
data class PointDocument(
    val x: Double,
    val y: Double,
)
