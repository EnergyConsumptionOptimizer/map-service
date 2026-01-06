package io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents

import kotlinx.serialization.Serializable

@Serializable
data class FloorPlanDocument(
    @Suppress("ConstructorParameterNaming")
    val _id: String? = null,
    val svgContent: String,
)
