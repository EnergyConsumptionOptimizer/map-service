package io.energyconsumptionoptimizer.mapservice.infrastructure.mongodb.mapper

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.infrastructure.mongodb.documents.FloorPlanDocument

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
