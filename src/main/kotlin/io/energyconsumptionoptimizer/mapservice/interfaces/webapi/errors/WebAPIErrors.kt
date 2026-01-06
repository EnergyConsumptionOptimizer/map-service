package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors

import kotlinx.serialization.Serializable

@Serializable
data class ErrorResponse(
    val error: String,
)

class EmptyUpdateRequestException : RuntimeException("At least one field must be provided for update")

class InvalidTokenException : Exception("Access token is required")

class UnauthorizedException(
    message: String = "Unauthorized",
) : Exception(message)

class AuthServiceUnavailableException : Exception("Authentication service unavailable")
