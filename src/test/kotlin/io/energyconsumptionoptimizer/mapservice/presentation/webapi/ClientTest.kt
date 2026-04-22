package io.energyconsumptionoptimizer.mapservice.presentation.webapi

import io.ktor.client.HttpClient
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.ApplicationTestBuilder

fun ApplicationTestBuilder.createJsonClient(): HttpClient =
    createClient {
        install(ContentNegotiation) {
            json()
        }
    }
