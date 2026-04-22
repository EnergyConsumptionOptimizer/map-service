package io.energyconsumptionoptimizer.mapservice.infrastructure.mongodb.documents

import kotlinx.serialization.Serializable

@Serializable
data class SmartFurnitureHookupDocument(
    @Suppress("ConstructorParameterNaming")
    val _id: String,
    val position: PointDocument,
    val zoneID: String?,
)
