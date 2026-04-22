package io.energyconsumptionoptimizer.mapservice.presentation.webapi

import io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes.floorPlanRoutes
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes.healthCheck
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes.houseMapRoutes
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes.internal.internalSmartFurnitureHookupRoutes
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes.smartFurnitureHookupRoutes
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes.zoneRoutes
import io.ktor.server.application.Application
import io.ktor.server.routing.routing

fun Application.configureRouting(dependencies: RoutingDependencies) {
    routing {
        healthCheck()

        houseMapRoutes(dependencies.houseMapServiceImpl, dependencies.authMiddleware)
        floorPlanRoutes(dependencies.floorPlanServiceImpl, dependencies.authMiddleware)
        zoneRoutes(
            dependencies.zoneServiceImpl,
            dependencies.authMiddleware,
        )
        smartFurnitureHookupRoutes(
            dependencies.smartFurnitureHookupServiceImpl,
            dependencies.authMiddleware,
        )
        internalSmartFurnitureHookupRoutes(
            dependencies.smartFurnitureHookupServiceImpl,
        )
    }
}
