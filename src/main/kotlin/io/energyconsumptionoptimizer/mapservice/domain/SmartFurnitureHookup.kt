package io.energyconsumptionoptimizer.mapservice.domain

data class SmartFurnitureHookup(
    var id: SmartFurnitureHookupID,
    var position: Point,
    var zoneID: ZoneID? = null,
)
