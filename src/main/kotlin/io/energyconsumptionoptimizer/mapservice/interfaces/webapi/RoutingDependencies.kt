package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.energyconsumptionoptimizer.mapservice.application.FloorPlanServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.HouseMapServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.SmartFurnitureHookupServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.ZoneServiceImpl
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.MongoHouseMapRepository
import io.ktor.client.HttpClient
import org.litote.kmongo.coroutine.CoroutineClient

class RoutingDependencies(
    mongoClient: CoroutineClient,
    databaseName: String,
    httpClient: HttpClient,
) {
    val mongoFloorPlanRepository: HouseMapRepository by lazy {
        MongoHouseMapRepository(
            mongoClient,
            databaseName,
        )
    }
    val floorPlanServiceImpl by lazy { FloorPlanServiceImpl(mongoFloorPlanRepository) }
    val zoneServiceImpl by lazy { ZoneServiceImpl(mongoFloorPlanRepository) }
    val smartFurnitureHookupServiceImpl by lazy { SmartFurnitureHookupServiceImpl(mongoFloorPlanRepository) }
    val houseMapServiceImpl by lazy {
        HouseMapServiceImpl(
            floorPlanServiceImpl,
            zoneServiceImpl,
            smartFurnitureHookupServiceImpl,
        )
    }

    val authMiddleware by lazy { AuthMiddleware(httpClient) }
}
