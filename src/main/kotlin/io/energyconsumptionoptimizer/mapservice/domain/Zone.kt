package io.energyconsumptionoptimizer.mapservice.domain

data class Zone(
    val id: ZoneID,
    var name: ZoneName,
    var color: Color,
    var vertices: List<Point>,
) {
    init {
        require(vertices.size >= 3) { "A zone must have at least 3 vertices" }
    }
}
