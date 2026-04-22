package io.energyconsumptionoptimizer.mapservice.presentation.webapi

import io.energyconsumptionoptimizer.mapservice.application.FloorPlanServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.HouseMapServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.SmartFurnitureHookupServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.ZoneServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.outbound.HouseMapRepository
import io.energyconsumptionoptimizer.mapservice.application.outbound.MonitoringService
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.middleware.AuthMiddleware
import io.ktor.client.HttpClient

class RoutingDependencies(
    mongoFloorPlanRepository: HouseMapRepository,
    monitoringService: MonitoringService,
    httpClient: HttpClient,
    userServiceUrl: String,
) {
    val floorPlanServiceImpl by lazy { FloorPlanServiceImpl(mongoFloorPlanRepository) }
    val zoneServiceImpl by lazy { ZoneServiceImpl(mongoFloorPlanRepository, monitoringService) }
    val smartFurnitureHookupServiceImpl by lazy { SmartFurnitureHookupServiceImpl(mongoFloorPlanRepository) }
    val houseMapServiceImpl by lazy {
        HouseMapServiceImpl(
            floorPlanServiceImpl,
            zoneServiceImpl,
            smartFurnitureHookupServiceImpl,
        )
    }

    val authMiddleware by lazy { AuthMiddleware(httpClient, userServiceUrl) }
}
