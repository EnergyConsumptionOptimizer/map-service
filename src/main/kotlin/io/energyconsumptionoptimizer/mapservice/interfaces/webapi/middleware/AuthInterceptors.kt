package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware

import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.AuthServiceUnavailableException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.ErrorResponse
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.InvalidTokenException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.UnauthorizedException
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.createRouteScopedPlugin
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.RouteSelector
import io.ktor.server.routing.RouteSelectorEvaluation
import io.ktor.server.routing.RoutingResolveContext

private fun Route.withAuthPlugin(
    pluginName: String,
    authenticate: suspend (ApplicationCall) -> Unit,
    build: Route.() -> Unit,
): Route {
    val authPlugin =
        createRouteScopedPlugin(pluginName) {
            onCall { call ->
                try {
                    authenticate(call)
                } catch (e: InvalidTokenException) {
                    call.respond(
                        HttpStatusCode.Unauthorized,
                        ErrorResponse(e.message ?: "Unauthorized"),
                    )
                } catch (e: UnauthorizedException) {
                    call.respond(
                        HttpStatusCode.Forbidden,
                        ErrorResponse(e.message ?: "Unauthorized"),
                    )
                } catch (e: AuthServiceUnavailableException) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        ErrorResponse(e.message ?: "Authentication error"),
                    )
                }
            }
        }

    val authenticatedRoute =
        createChild(
            object : RouteSelector() {
                override suspend fun evaluate(
                    context: RoutingResolveContext,
                    segmentIndex: Int,
                ) = RouteSelectorEvaluation.Constant
            },
        )

    authenticatedRoute.install(authPlugin)
    authenticatedRoute.build()
    return authenticatedRoute
}

fun Route.withAuth(
    authMiddleware: AuthMiddleware,
    build: Route.() -> Unit,
): Route = withAuthPlugin("AuthPlugin", authMiddleware::authenticate, build)

fun Route.withAdminAuth(
    authMiddleware: AuthMiddleware,
    build: Route.() -> Unit,
): Route = withAuthPlugin("AdminAuthPlugin", authMiddleware::authenticateAdmin, build)

//
// fun Route.withAuth(authMiddleware: AuthMiddleware, build: Route.() -> Unit): Route {
//    val authPlugin = createRouteScopedPlugin("AuthPlugin") {
//        onCall { call ->
//            try {
//                authMiddleware.authenticate(call)
//            } catch (e: InvalidTokenException) {
//                call.respond(
//                    HttpStatusCode.Unauthorized,
//                    ErrorResponse(e.message ?: "Unauthorized")
//                )
//            } catch (e: UnauthorizedException) {
//                call.respond(
//                    HttpStatusCode.Forbidden,
//                    ErrorResponse(e.message ?: "Unauthorized")
//                )
//            } catch (e: AuthServiceUnavailableException) {
//                call.respond(
//                    HttpStatusCode.InternalServerError,
//                    ErrorResponse(e.message ?: "Authentication error")
//                )
//            }
//        }
//    }
//
//    install(authPlugin)
//    build()
//    return this
// }
//
//
// fun Route.withAdminAuth(
//    authMiddleware: AuthMiddleware,
//    build: Route.() -> Unit,
// ): Route {
//    val adminAuthPlugin  =
//        createRouteScopedPlugin("AdminAuthPlugin") {
//            onCall { call ->
//                try {
//                    authMiddleware.authenticateAdmin(call)
//                } catch (e: InvalidTokenException) {
//                    call.respond(
//                        HttpStatusCode.Unauthorized,
//                        ErrorResponse(e.message ?: "Unauthorized")
//                    )
//                } catch (e: UnauthorizedException) {
//                    call.respond(
//                        HttpStatusCode.Forbidden,
//                        ErrorResponse(e.message ?: "Unauthorized")
//                    )
//                } catch (e: AuthServiceUnavailableException) {
//                    call.respond(
//                        HttpStatusCode.InternalServerError,
//                        ErrorResponse(e.message ?: "Authentication error")
//                    )
//                }
//            }
//        }
//
//    install(adminAuthPlugin)
//    build()
//    return this
// }
