package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes

import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.SmartFurnitureHookupService
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.extensions.receiveNonEmpty
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.extensions.requireSmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.withAdminAuth
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.withAuth
import io.energyconsumptionoptimizer.mapservice.presentation.dto.SmartFurnitureHookupsDTO
import io.energyconsumptionoptimizer.mapservice.presentation.mappers.SmartFurnitureHookupMapper
import io.energyconsumptionoptimizer.mapservice.presentation.requests.CreateSmartFurnitureHookupRequest
import io.energyconsumptionoptimizer.mapservice.presentation.requests.UpdateSmartFurnitureHookupRequest
import io.energyconsumptionoptimizer.mapservice.presentation.requests.isEmpty
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route

fun Route.smartFurnitureHookupRoutes(
    smartFurnitureHookupService: SmartFurnitureHookupService,
    authMiddleware: AuthMiddleware,
) {
    route("api/smart-furniture-hookups") {
        withAdminAuth(authMiddleware) {
            post {
                val request = call.receive<CreateSmartFurnitureHookupRequest>()

                val smartFurnitureHookup =
                    smartFurnitureHookupService.createSmartFurnitureHookup(
                        id = SmartFurnitureHookupID(request.id),
                        position = request.position.x to request.position.y,
                        zoneID = request.zoneID?.let { ZoneID(it) },
                    )

                return@post call.respond(HttpStatusCode.Created, SmartFurnitureHookupMapper.toDTO(smartFurnitureHookup))
            }
            route("{id}") {
                patch {
                    val id = call.requireSmartFurnitureHookupID()

                    val request = call.receiveNonEmpty<UpdateSmartFurnitureHookupRequest> { it.isEmpty() }

                    val smartFurnitureHookup =
                        smartFurnitureHookupService.updateSmartFurnitureHookup(
                            id = id,
                            position = request.position?.let { request.position.x to request.position.y },
                            zoneID = request.zoneID?.let { ZoneID(it) },
                        )

                    return@patch call.respond(HttpStatusCode.OK, SmartFurnitureHookupMapper.toDTO(smartFurnitureHookup))
                }
                delete {
                    val id = call.requireSmartFurnitureHookupID()

                    smartFurnitureHookupService.deleteSmartFurnitureHookup(
                        id = id,
                    )

                    return@delete call.respond(HttpStatusCode.NoContent)
                }
            }
        }
        withAuth(authMiddleware) {
            get {
                val smartFurnitureHookups = smartFurnitureHookupService.getSmartFurnitureHookups()

                return@get call.respond(
                    HttpStatusCode.OK,
                    SmartFurnitureHookupsDTO(smartFurnitureHookups.map { SmartFurnitureHookupMapper.toDTO(it) }),
                )
            }
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
}
