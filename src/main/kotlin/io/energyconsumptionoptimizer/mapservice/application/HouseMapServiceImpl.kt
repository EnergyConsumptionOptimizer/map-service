package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.domain.HouseMap
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanFormatNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.FloorPlanService
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapService
import io.energyconsumptionoptimizer.mapservice.domain.ports.SmartFurnitureHookupService
import io.energyconsumptionoptimizer.mapservice.domain.ports.ZoneService

class HouseMapServiceImpl(
    private val floorPlanService: FloorPlanService,
    private val zoneService: ZoneService,
    private val smartFurnitureHookupService: SmartFurnitureHookupService,
) : HouseMapService {
    override suspend fun getHouseMap(): HouseMap {
        val florPlan = floorPlanService.getFloorPlan() ?: throw FlorPlanFormatNotFoundException()
        val zones = zoneService.getZones()
        val smartFurnitureHookups = smartFurnitureHookupService.getSmartFurnitureHookups()

        return HouseMap(florPlan, zones, smartFurnitureHookups)
    }
}
