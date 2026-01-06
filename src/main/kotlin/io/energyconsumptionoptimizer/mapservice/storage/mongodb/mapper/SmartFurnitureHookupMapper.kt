package io.energyconsumptionoptimizer.mapservice.storage.mongodb.mapper

import io.energyconsumptionoptimizer.mapservice.domain.Point
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.PointDocument
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.SmartFurnitureHookupDocument

object SmartFurnitureHookupMapper {
    fun toDocument(smartFurnitureHookup: SmartFurnitureHookup): SmartFurnitureHookupDocument =
        SmartFurnitureHookupDocument(
            _id = smartFurnitureHookup.id.value,
            position = PointDocument(smartFurnitureHookup.position.x, smartFurnitureHookup.position.y),
            zoneID = smartFurnitureHookup.zoneID?.value,
        )

    fun toDomain(document: SmartFurnitureHookupDocument): SmartFurnitureHookup =
        SmartFurnitureHookup(
            id = SmartFurnitureHookupID(document._id),
            position = Point(document.position.x, document.position.y),
            zoneID = document.zoneID?.let { ZoneID(it) },
        )
}
