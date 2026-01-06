package io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents

import kotlinx.serialization.Serializable

@Serializable
data class ZoneDocument(
    @Suppress("ConstructorParameterNaming")
    val _id: String,
    val name: String,
    val color: String,
    val vertices: List<PointDocument>,
)
