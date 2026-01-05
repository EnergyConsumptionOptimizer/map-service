package io.energyconsumptionoptimizer.mapservice.domain

object SmartFurnitureHookupFactory {
    fun create(
        position: Pair<Double, Double>,
        zoneID: ZoneID? = null,
    ): SmartFurnitureHookup =
        SmartFurnitureHookup(
            id = SmartFurnitureHookupID(""),
            position = Point(position.first, position.second),
            zoneID = zoneID,
        )
}
