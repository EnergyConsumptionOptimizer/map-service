package io.energyconsumptionoptimizer.mapservice.presentation.webapi.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.healthCheck() {
    route("/health") {
        get {
            return@get call.respond(HttpStatusCode.OK, mapOf("status" to "OK"))
        }
    }
}
