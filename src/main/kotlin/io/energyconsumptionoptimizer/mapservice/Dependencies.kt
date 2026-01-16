package io.energyconsumptionoptimizer.mapservice

import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.RoutingDependencies
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.MongoHouseMapRepository
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import org.litote.kmongo.coroutine.CoroutineClient
import org.litote.kmongo.coroutine.coroutine
import org.litote.kmongo.reactivestreams.KMongo

data class AppConfig(
    val mongoUri: String,
    val mongoDatabase: String,
    val userServiceUrl: String,
)

class Dependencies(
    private val config: AppConfig,
) {
    val mongoClient: CoroutineClient by lazy {
        KMongo.createClient(config.mongoUri).coroutine
    }

    val httpClient: HttpClient by lazy {
        HttpClient(CIO) {
            install(ContentNegotiation) {
                json(
                    Json {
                        prettyPrint = true
                        isLenient = true
                        ignoreUnknownKeys = true
                    },
                )
            }
            expectSuccess = true
        }
    }

    val mongoFloorPlanRepository: HouseMapRepository by lazy {
        MongoHouseMapRepository(
            mongoClient,
            databaseName = config.mongoDatabase,
        )
    }

    val routeDependencies by lazy { RoutingDependencies(mongoFloorPlanRepository, httpClient, config.userServiceUrl) }

    fun shutdown() {
        httpClient.close()
    }
}
