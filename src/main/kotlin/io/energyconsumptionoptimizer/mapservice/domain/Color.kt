package io.energyconsumptionoptimizer.mapservice.domain

@JvmInline
value class Color(
    val value: String,
) {
    init {
        require(value.matches(Regex("^#[0-9A-Fa-f]{6}$"))) {
            "Color must be in hex format #RRGGBB"
        }
    }
}
