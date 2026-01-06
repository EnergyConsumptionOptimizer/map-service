package io.energyconsumptionoptimizer.mapservice.presentation.mappers

import io.energyconsumptionoptimizer.mapservice.domain.HouseMap
import io.energyconsumptionoptimizer.mapservice.presentation.dto.HouseMapDTO

object HouseMapMapper {
    fun toDTO(houseMap: HouseMap): HouseMapDTO =
        HouseMapDTO(
            floorPlan = FloorPlanMapper.toDTO(houseMap.floorPlan),
            zones = houseMap.zones.map { ZoneMapper.toDTO(it) },
            smartFurnitureHookups = houseMap.smartFurnitureHookups.map { SmartFurnitureHookupMapper.toDTO(it) },
        )
}
