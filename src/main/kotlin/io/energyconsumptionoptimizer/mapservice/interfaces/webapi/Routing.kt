package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes.floorPlanRoutes
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes.smartFurnitureHookupRoutes
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes.zoneRoutes
import io.ktor.server.application.Application
import io.ktor.server.routing.routing

fun Application.configureRouting(dependencies: RoutingDependencies) {
    routing {
        floorPlanRoutes(dependencies.floorPlanServiceImpl, dependencies.authMiddleware)
        zoneRoutes(
            dependencies.zoneServiceImpl,
            dependencies.authMiddleware,
        )
        smartFurnitureHookupRoutes(
            dependencies.smartFurnitureHookupServiceImpl,
            dependencies.authMiddleware,
        )
    }
}
