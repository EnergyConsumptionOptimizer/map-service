package io.energyconsumptionoptimizer.mapservice.domain.utils

import io.energyconsumptionoptimizer.mapservice.domain.Point

fun isPointInPolygon(
    point: Point,
    vertices: List<Point>,
): Boolean {
    var inside = false
    val x = point.x
    val y = point.y

    var j = vertices.size - 1
    for (i in vertices.indices) {
        val xi = vertices[i].x
        val yi = vertices[i].y
        val xj = vertices[j].x
        val yj = vertices[j].y

        val intersect =
            (yi > y) != (yj > y) &&
                x < (xj - xi) * (y - yi) / (yj - yi) + xi

        if (intersect) inside = !inside

        j = i
    }

    return inside
}
