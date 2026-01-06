package io.energyconsumptionoptimizer.mapservice.storage.mongodb.mapper

import io.energyconsumptionoptimizer.mapservice.domain.Color
import io.energyconsumptionoptimizer.mapservice.domain.Point
import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneName
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.PointDocument
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.ZoneDocument

object ZoneMapper {
    fun toDocument(zone: Zone): ZoneDocument =
        ZoneDocument(
            _id = zone.id.value,
            name = zone.name.value,
            color = zone.color.value,
            vertices = zone.vertices.map { PointDocument(it.x, it.y) },
        )

    fun toDomain(document: ZoneDocument): Zone =
        Zone(
            id = ZoneID(document._id),
            name = ZoneName(document.name),
            color = Color(document.color),
            vertices = document.vertices.map { Point(it.x, it.y) },
        )
}
