package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install

fun Application.configureApp(routingDependencies: RoutingDependencies) {
    install(io.ktor.server.plugins.contentnegotiation.ContentNegotiation) {
        json()
    }
    configureStatusPages()
    configureRouting(routingDependencies)
}
