package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes

import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapService
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.withAuth
import io.energyconsumptionoptimizer.mapservice.presentation.mappers.HouseMapMapper
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.houseMapRoutes(
    houseMapService: HouseMapService,
    authMiddleware: AuthMiddleware,
) {
    route("api/house-map") {
        withAuth(authMiddleware) {
            get {
                val map = houseMapService.getHouseMap()
                return@get call.respond(HttpStatusCode.Created, HouseMapMapper.toDTO(map))
            }
        }
    }
}
