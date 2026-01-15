package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes.internal

import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.SmartFurnitureHookupService
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.extensions.requireSmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.presentation.mappers.SmartFurnitureHookupMapper
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.internalSmartFurnitureHookupRoutes(smartFurnitureHookupService: SmartFurnitureHookupService) {
    route("api/internal/smart-furniture-hookups") {
        route("{id}") {
            get {
                val id = call.requireSmartFurnitureHookupID()

                val smartFurnitureHookup =
                    smartFurnitureHookupService.getSmartFurnitureHookup(id)
                        ?: throw SmartFurnitureHookupIDNotFoundException(id.value)

                return@get call.respond(HttpStatusCode.OK, SmartFurnitureHookupMapper.toDTO(smartFurnitureHookup))
            }
        }
    }
}
