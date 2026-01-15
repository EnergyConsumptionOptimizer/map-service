package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.routes

import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.ZoneService
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.extensions.receiveNonEmpty
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.extensions.requireZoneID
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.withAdminAuth
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.withAuth
import io.energyconsumptionoptimizer.mapservice.presentation.dto.ZonesDTO
import io.energyconsumptionoptimizer.mapservice.presentation.mappers.ZoneMapper
import io.energyconsumptionoptimizer.mapservice.presentation.requests.CreateZoneRequest
import io.energyconsumptionoptimizer.mapservice.presentation.requests.UpdateZoneRequest
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

fun Route.zoneRoutes(
    zoneService: ZoneService,
    authMiddleware: AuthMiddleware,
) {
    route("api/zones") {
        withAuth(authMiddleware) {
            get {
                val zones = zoneService.getZones()

                return@get call.respond(HttpStatusCode.OK, ZonesDTO(zones.map { ZoneMapper.toDTO(it) }))
            }
            route("{id}") {
                get {
                    val id = call.requireZoneID()

                    val zone =
                        zoneService.getZone(id)
                            ?: throw ZoneIDNotFoundException(id.value)

                    return@get call.respond(HttpStatusCode.OK, ZoneMapper.toDTO(zone))
                }
            }
        }
        withAdminAuth(authMiddleware) {
            post {
                val request = call.receive<CreateZoneRequest>()

                val zone =
                    zoneService.createZone(
                        name = request.name,
                        colorHex = request.color,
                        vertices = request.vertices.map { it.x to it.y },
                    )
                return@post call.respond(HttpStatusCode.Created, ZoneMapper.toDTO(zone))
            }
            route("{id}") {
                patch {
                    val id = call.requireZoneID()

                    val request = call.receiveNonEmpty<UpdateZoneRequest> { it.isEmpty() }

                    val zone =
                        zoneService.updateZone(
                            id = id,
                            name = request.name,
                            colorHex = request.color,
                            vertices = request.vertices?.map { it.x to it.y },
                        )

                    return@patch call.respond(HttpStatusCode.OK, ZoneMapper.toDTO(zone))
                }
                delete {
                    val id = call.requireZoneID()

                    zoneService.deleteZone(
                        id = id,
                    )

                    return@delete call.respond(HttpStatusCode.NoContent)
                }
            }
        }
    }
}
