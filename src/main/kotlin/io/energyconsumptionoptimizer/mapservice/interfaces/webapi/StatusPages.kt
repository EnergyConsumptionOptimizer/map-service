package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanFormatNotValidException
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupAlreadyExistsException
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneNameAlreadyExistsException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.EmptyUpdateRequestException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.ErrorResponse
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.JsonConvertException
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.application.log
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.ContentTransformationException
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond

@Suppress("Detekt.LongMethod")
fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<FlorPlanFormatNotValidException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(cause.message!!),
            )
        }

        exception<FlorPlanNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(cause.message!!),
            )
        }

        exception<SmartFurnitureHookupIDNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                mapOf("error" to (cause.message ?: "SmartFurnitureHookupIDNotFoundException")),
            )
        }

        exception<ZoneIDNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                mapOf("error" to (cause.message ?: "ZoneIDNotFoundException")),
            )
        }

        exception<ZoneNameAlreadyExistsException> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                mapOf("error" to (cause.message ?: "ZoneNameAlreadyExistsException")),
            )
        }

        exception<SmartFurnitureHookupAlreadyExistsException> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                mapOf("error" to (cause.message ?: "SmartFurnitureHookupAlreadyExistsException")),
            )
        }

        exception<EmptyUpdateRequestException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(cause.message!!),
            )
        }

        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                mapOf("error" to (cause.message ?: "Invalid request")),
            )
        }

        exception<Exception> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                mapOf("error" to "An unexpected error occurred"),
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
                ErrorResponse(error = errorMessage),
            )
        }

        exception<ContentTransformationException> { call, _ ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(error = "Invalid request format"),
            )
        }

        exception<Exception> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(error = "An unexpected error occurred"),
            )
        }
    }
}
