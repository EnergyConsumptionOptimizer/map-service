package io.energyconsumptionoptimizer.mapservice

import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.configureRouting
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.configureStatusPages
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import kotlinx.serialization.json.Json

fun Application.module(dependencies: Dependencies) {
    configureSerialization()
    configureRouting(dependencies.routeDependencies)
    configureStatusPages()
}

private fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(
            Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            },
        )
    }
}
