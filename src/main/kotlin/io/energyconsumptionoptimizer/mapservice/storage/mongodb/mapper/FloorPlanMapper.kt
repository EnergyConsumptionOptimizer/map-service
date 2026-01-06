package io.energyconsumptionoptimizer.mapservice.storage.mongodb.mapper

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.FloorPlanDocument

object FloorPlanMapper {
    fun toDocument(floorPlan: FloorPlan): FloorPlanDocument =
        FloorPlanDocument(
            _id = null,
            svgContent = floorPlan.svgContent,
        )

    fun toDomain(document: FloorPlanDocument): FloorPlan =
        FloorPlan(
            svgContent = document.svgContent,
        )
}
