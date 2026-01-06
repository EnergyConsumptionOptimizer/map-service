package io.energyconsumptionoptimizer.mapservice.presentation.mappers

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.presentation.dto.FloorPlanDTO

object FloorPlanMapper {
    fun toDTO(fp: FloorPlan): FloorPlanDTO =
        FloorPlanDTO(
            svgContent = fp.svgContent,
        )
}
