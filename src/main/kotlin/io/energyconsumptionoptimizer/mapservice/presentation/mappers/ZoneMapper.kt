package io.energyconsumptionoptimizer.mapservice.presentation.mappers

import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.presentation.dto.ZoneDTO

object ZoneMapper {
    fun toDTO(z: Zone): ZoneDTO =
        ZoneDTO(
            id = z.id.value,
            name = z.name.value,
            color = z.color.value,
            vertices = z.vertices.map { PointMapper.toDTO(it) },
        )
}
