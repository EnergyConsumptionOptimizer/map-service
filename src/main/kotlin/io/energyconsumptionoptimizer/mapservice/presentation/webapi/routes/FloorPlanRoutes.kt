package io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes

import io.energyconsumptionoptimizer.mapservice.application.inbound.FloorPlanService
import io.energyconsumptionoptimizer.mapservice.presentation.mappers.FloorPlanMapper
import io.energyconsumptionoptimizer.mapservice.presentation.requests.UploadSvgRequest
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.middleware.withAdminAuth
import io.energyconsumptionoptimizer.mapservice.presentation.webapi.middleware.withAuth
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
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
                val request = call.receive<UploadSvgRequest>()
                val svgContent = request.svgContent

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
