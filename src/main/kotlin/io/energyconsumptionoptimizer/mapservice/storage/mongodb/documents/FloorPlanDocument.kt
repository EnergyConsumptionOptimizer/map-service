package io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents

import kotlinx.serialization.Serializable

@Serializable
data class FloorPlanDocument(
    val _id: String? = null,
    val svgContent: String,
)
