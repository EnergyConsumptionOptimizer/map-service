package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes

import io.energyconsumptionoptimizer.mapservice.domain.ports.FloorPlanService
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.withAdminAuth
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.withAuth
import io.energyconsumptionoptimizer.mapservice.presentation.mappers.FloorPlanMapper
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

fun Route.floorPlanRoutes(
    floorPlanService: FloorPlanService,
    authMiddleware: AuthMiddleware,
) {
    route("api/floor-plan") {
        withAdminAuth(authMiddleware) {
            post {
                val svgContent = call.parameters["svgContent"]
                if (svgContent == null) {
                    call.respond(HttpStatusCode.BadRequest, "Missing svg content")
                    return@post
                }

                val floorPlan = floorPlanService.createFloorPlan(svgContent)

                call.respond(HttpStatusCode.Created, FloorPlanMapper.toDTO(floorPlan))
            }
        }
        withAuth(authMiddleware) {
            get {
                val floorPlan =
                    floorPlanService.getFloorPlan() ?: return@get call.respond(
                        HttpStatusCode.NotFound,
                        "Floor plan not found",
                    )

                return@get call.respond(HttpStatusCode.OK, FloorPlanMapper.toDTO(floorPlan))
            }
        }
    }
}
