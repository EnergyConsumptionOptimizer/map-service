package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware

import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.AuthServiceUnavailableException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.InvalidTokenException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.UnauthorizedException
import io.ktor.client.HttpClient
import io.ktor.client.plugins.ResponseException
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import kotlinx.io.IOException

class AuthMiddleware(
    private val httpClient: HttpClient,
) {
    val userServiceUri: String = "http://localhost:3000"

    private fun getAuthTokenFromCookies(call: ApplicationCall): String {
        val token = call.request.cookies["authToken"] ?: throw InvalidTokenException()

        return token
    }

    private suspend fun verifyToken(
        endpoint: String,
        call: ApplicationCall,
    ) {
        println(endpoint)
        val token = getAuthTokenFromCookies(call)

        try {
            val response =
                httpClient.get("$userServiceUri$endpoint") {
                    header("Cookie", "authToken=$token")
                }

            if (response.status != HttpStatusCode.OK) {
                throw UnauthorizedException("Token verification failed")
            }
        } catch (_: ResponseException) {
            throw UnauthorizedException()
        } catch (_: IOException) {
            throw AuthServiceUnavailableException()
        }
    }

    suspend fun authenticate(call: ApplicationCall) = verifyToken("/api/internal/auth/verify", call)

    suspend fun authenticateAdmin(call: ApplicationCall) = verifyToken("/api/internal/auth/verify-admin", call)
}
