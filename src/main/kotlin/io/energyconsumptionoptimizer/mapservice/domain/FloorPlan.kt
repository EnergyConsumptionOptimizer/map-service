package io.energyconsumptionoptimizer.mapservice.domain

data class FloorPlan(
    val svgContent: String,
) {
    init {
        require(svgContent.isNotEmpty()) { "SVG content cannot be empty" }
    }
}
