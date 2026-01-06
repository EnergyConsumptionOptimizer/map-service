package io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents

import kotlinx.serialization.Serializable

@Serializable
data class SmartFurnitureHookupDocument(
    @Suppress("ConstructorParameterNaming")
    val _id: String,
    val position: PointDocument,
    val zoneID: String?,
)
