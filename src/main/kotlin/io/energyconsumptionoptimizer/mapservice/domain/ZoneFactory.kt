package io.energyconsumptionoptimizer.mapservice.domain

object ZoneFactory {
    fun create(
        name: String,
        colorHex: String,
        vertices: List<Pair<Double, Double>>,
    ): Zone =
        Zone(
            id = ZoneID(""),
            name = ZoneName(name),
            color = Color(colorHex),
            vertices = vertices.map { Point(it.first, it.second) },
        )
}
