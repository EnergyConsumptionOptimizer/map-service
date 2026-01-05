package io.energyconsumptionoptimizer.mapservice.domain

@JvmInline
value class ZoneName(
    val value: String,
) {
    init {
        require(value.isNotBlank()) { "Zone name cannot be blank" }
    }
}
