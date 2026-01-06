package io.energyconsumptionoptimizer.mapservice.presentation.mappers

import io.energyconsumptionoptimizer.mapservice.domain.Point
import io.energyconsumptionoptimizer.mapservice.presentation.dto.PointDTO

object PointMapper {
    fun toDTO(p: Point): PointDTO = PointDTO(p.x, p.y)
}
