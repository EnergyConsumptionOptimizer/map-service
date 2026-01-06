package io.energyconsumptionoptimizer.mapservice.presentation.mappers

import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.presentation.dto.SmartFurnitureHookupDTO

object SmartFurnitureHookupMapper {
    fun toDTO(sfh: SmartFurnitureHookup): SmartFurnitureHookupDTO =
        SmartFurnitureHookupDTO(
            id = sfh.id.value,
            position = PointMapper.toDTO(sfh.position),
            zoneID = sfh.zoneID?.value,
        )
}
