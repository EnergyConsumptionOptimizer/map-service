package io.energyconsumptionoptimizer.mapservice.presentation.requests

import kotlinx.serialization.Serializable

@Serializable
data class UploadSvgRequest(
    val svgContent: String,
)
