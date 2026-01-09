package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.extensions

import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.EmptyUpdateRequestException
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receive

/**
 * Receives a request body of type [T] and ensures it is not considered empty.
 *
 * This helper function is useful for update endpoints where an empty payload
 * (e.g., no fields to update) should be rejected. The caller provides a custom
 * [isEmpty] predicate to define what "empty" means for the given type.
 *
 * @param T The expected request body type.
 * @param isEmpty A predicate that returns `true` if the received request
 *                should be treated as empty or invalid.
 *
 * @return The deserialized request body if it is not empty.
 *
 * @throws EmptyUpdateRequestException if the request body is considered empty
 *         according to the [isEmpty] predicate.
 */
@Suppress("RedundantSuspendModifier")
suspend inline fun <reified T : Any> ApplicationCall.receiveNonEmpty(isEmpty: (T) -> Boolean): T {
    val request = receive<T>()
    if (isEmpty(request)) {
        throw EmptyUpdateRequestException()
    }
    return request
}
