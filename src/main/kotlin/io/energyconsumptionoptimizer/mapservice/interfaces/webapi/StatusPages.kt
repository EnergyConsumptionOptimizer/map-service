package io.energyconsumptionoptimizer.mapservice.interfaces.webapi
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanFormatNotValidException
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupAlreadyExistsException
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneNameAlreadyExistsException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.EmptyUpdateRequestException
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.JsonConvertException
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.application.log
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.ContentTransformationException
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import kotlinx.serialization.Serializable

@Suppress("Detekt.LongMethod")
fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<ZoneNameAlreadyExistsException> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                ApiErrorResponse(
                    code = "CONFLICT",
                    message = "Zone name conflict",
                    errors = mapOf("name" to "The name is already in use"),
                ),
            )
        }

        exception<SmartFurnitureHookupAlreadyExistsException> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                ApiErrorResponse(
                    code = "CONFLICT",
                    message = "Smart furniture hookup conflict",
                    errors = mapOf("id" to "This ID is already in use"),
                ),
            )
        }

        exception<FlorPlanNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ApiErrorResponse(code = "RESOURCE_NOT_FOUND", message = cause.message ?: "Floor plan not found"),
            )
        }

        exception<SmartFurnitureHookupIDNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ApiErrorResponse(code = "RESOURCE_NOT_FOUND", message = cause.message ?: "Smart furniture hookup not found"),
            )
        }

        exception<ZoneIDNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ApiErrorResponse(code = "RESOURCE_NOT_FOUND", message = cause.message ?: "Zone not found"),
            )
        }

        exception<FlorPlanFormatNotValidException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ApiErrorResponse(code = "VALIDATION_ERROR", message = cause.message ?: "Invalid SVG format"),
            )
        }

        exception<EmptyUpdateRequestException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ApiErrorResponse(code = "BAD_REQUEST", message = cause.message ?: "Empty update request"),
            )
        }

        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ApiErrorResponse(code = "BAD_REQUEST", message = cause.message ?: "Invalid request"),
            )
        }

        exception<BadRequestException> { call, cause ->
            val errorMessage =
                when (val innerCause = cause.cause) {
                    is JsonConvertException -> {
                        innerCause.message?.let { msg ->
                            when {
                                msg.contains("are required") -> "Missing required fields in request body"
                                msg.contains("Illegal input") -> "Invalid request format"
                                else -> "Invalid JSON format"
                            }
                        } ?: "Invalid request body"
                    }

                    else -> {
                        "Invalid request body"
                    }
                }

            call.respond(
                HttpStatusCode.BadRequest,
                ApiErrorResponse(code = "BAD_REQUEST", message = errorMessage),
            )
        }

        exception<ContentTransformationException> { call, _ ->
            call.respond(
                HttpStatusCode.BadRequest,
                ApiErrorResponse(code = "BAD_REQUEST", message = "Invalid request format"),
            )
        }

        exception<Exception> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ApiErrorResponse(code = "INTERNAL_ERROR", message = "An unexpected error occurred"),
            )
        }
    }
}

@Serializable
data class ApiErrorResponse(
    val code: String,
    val message: String,
    val errors: Map<String, String>? = null,
)
