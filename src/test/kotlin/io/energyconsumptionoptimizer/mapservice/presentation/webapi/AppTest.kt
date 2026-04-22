package io.energyconsumptionoptimizer.mapservice.presentation.webapi

import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation

fun Application.configureApp(routingDependencies: RoutingDependencies) {
    install(ContentNegotiation) {
        json()
    }
    configureStatusPages()
    configureRouting(routingDependencies)
}
