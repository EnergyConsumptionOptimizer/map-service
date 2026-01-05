package io.energyconsumptionoptimizer.mapservice.domain

data class HouseMap(
    val floorPlan: FloorPlan,
    val zones: List<Zone>,
    val smartFurnitureHookups: List<SmartFurnitureHookup>,
)
