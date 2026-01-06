package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.energyconsumptionoptimizer.mapservice.application.SmartFurnitureHookupServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.craftSmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.InvalidTokenException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.UnauthorizedException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.presentation.dto.PointDTO
import io.energyconsumptionoptimizer.mapservice.presentation.requests.CreateSmartFurnitureHookupRequest
import io.energyconsumptionoptimizer.mapservice.presentation.requests.UpdateSmartFurnitureHookupRequest
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import io.mockk.Runs
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.just
import io.mockk.mockk

class SmartFurnitureHookupRoutesTest :
    ShouldSpec({
        lateinit var hookupService: SmartFurnitureHookupServiceImpl
        lateinit var authMiddleware: AuthMiddleware
        lateinit var routingDependencies: RoutingDependencies

        beforeEach {
            hookupService = mockk()
            authMiddleware = mockk()
            routingDependencies = mockk()

            every { routingDependencies.smartFurnitureHookupServiceImpl } returns hookupService
            every { routingDependencies.authMiddleware } returns authMiddleware
            every { routingDependencies.floorPlanServiceImpl } returns mockk(relaxed = true)
            every { routingDependencies.houseMapServiceImpl } returns mockk(relaxed = true)
            every { routingDependencies.zoneServiceImpl } returns mockk(relaxed = true)
        }

        afterEach {
            clearAllMocks()
        }

        context("POST /api/smart-furniture-hookups") {
            should("create hookup successfully") {
                val hookup = craftSmartFurnitureHookup()
                val request =
                    CreateSmartFurnitureHookupRequest(
                        id = hookup.id.value,
                        position = hookup.position.let { PointDTO(it.x, it.y) },
                        zoneID = null,
                    )

                coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                coEvery { hookupService.createSmartFurnitureHookup(any(), any(), any()) } returns hookup

                testApplication {
                    application { configureApp(routingDependencies) }

                    val client = createJsonClient()

                    val response =
                        client.post("/api/smart-furniture-hookups") {
                            contentType(ContentType.Application.Json)
                            setBody(request)
                        }

                    response.status shouldBe HttpStatusCode.Created
                    response.bodyAsText() shouldContain hookup.id.value

                    coVerify(exactly = 1) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { hookupService.createSmartFurnitureHookup(any(), any(), any()) }
                }
            }
            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response =
                        client.post("/api/smart-furniture-hookups") {
                            contentType(ContentType.Application.Json)
                            setBody("""{}""")
                        }

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }
            should("fail for regular authenticated user without admin") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws UnauthorizedException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response =
                        client.post("/api/smart-furniture-hookups") {
                            contentType(ContentType.Application.Json)
                            setBody("""{}""")
                        }

                    response.status shouldBe HttpStatusCode.Forbidden
                }
            }
        }

        context("GET /api/smart-furniture-hookups") {
            should("return all hookups successfully") {
                val hookups =
                    listOf(
                        craftSmartFurnitureHookup(SmartFurnitureHookupID("hookup-1")),
                        craftSmartFurnitureHookup(SmartFurnitureHookupID("hookup-2")),
                    )

                coEvery { authMiddleware.authenticate(any()) } just Runs
                coEvery { hookupService.getSmartFurnitureHookups() } returns hookups

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/smart-furniture-hookups")

                    response.status shouldBe HttpStatusCode.OK

                    response.bodyAsText() shouldContain "hookup-1"
                    response.bodyAsText() shouldContain "hookup-2"

                    coVerify(exactly = 1) { authMiddleware.authenticate(any()) }
                    coVerify(exactly = 0) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { hookupService.getSmartFurnitureHookups() }
                }
            }
            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticate(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/smart-furniture-hookups")

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }
        }
        context("GET /api/smart-furniture-hookups/{id}") {
            should("return specific hookup successfully") {
                val hookup = craftSmartFurnitureHookup(SmartFurnitureHookupID("hookup-1"))

                coEvery { authMiddleware.authenticate(any()) } just Runs
                coEvery { hookupService.getSmartFurnitureHookup(any()) } returns hookup

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/smart-furniture-hookups/hookup-1")

                    response.status shouldBe HttpStatusCode.OK
                    response.bodyAsText() shouldContain "hookup-1"

                    coVerify(exactly = 1) { authMiddleware.authenticate(any()) }
                    coVerify(exactly = 0) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { hookupService.getSmartFurnitureHookup(any()) }
                }
            }
            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticate(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/smart-furniture-hookups/hookup-1")

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }
        }
        context("PATCH /api/smart-furniture-hookups/{id}") {
            should("update hookup successfully") {
                val hookup = craftSmartFurnitureHookup(SmartFurnitureHookupID("hookup-1"))

                val request =
                    UpdateSmartFurnitureHookupRequest(
                        position = hookup.position.let { PointDTO(it.x, it.y) },
                        zoneID = null,
                    )

                coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                coEvery { hookupService.updateSmartFurnitureHookup(any(), any(), any()) } returns hookup

                testApplication {
                    application { configureApp(routingDependencies) }

                    val client = createJsonClient()

                    val response =
                        client.patch("/api/smart-furniture-hookups/hookup-1") {
                            contentType(ContentType.Application.Json)
                            setBody(request)
                        }

                    response.status shouldBe HttpStatusCode.OK
                    response.bodyAsText() shouldContain hookup.id.value

                    coVerify(exactly = 1) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { hookupService.updateSmartFurnitureHookup(any(), any(), any()) }
                }
            }
            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response =
                        client.patch("/api/smart-furniture-hookups/hookup-1") {
                            contentType(ContentType.Application.Json)
                            setBody("""{"position": {"x": 10.0, "y": 10.0}}""")
                        }

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }
            should("fail for regular authenticated user without admin") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws UnauthorizedException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response =
                        client.patch("/api/smart-furniture-hookups/hookup-1") {
                            contentType(ContentType.Application.Json)
                            setBody("""{"position": {"x": 10.0, "y": 10.0}}""")
                        }

                    response.status shouldBe HttpStatusCode.Forbidden
                }
            }
        }
        context("DELETE /api/smart-furniture-hookups/{id}") {
            should("delete hookup successfully") {
                coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                coEvery { hookupService.deleteSmartFurnitureHookup(any()) } just Runs

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.delete("/api/smart-furniture-hookups/hookup-1")

                    response.status shouldBe HttpStatusCode.NoContent

                    coVerify(exactly = 1) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { hookupService.deleteSmartFurnitureHookup(any()) }
                }
            }

            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.delete("/api/smart-furniture-hookups/hookup-1")

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }

            should("fail for regular authenticated user without admin") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws UnauthorizedException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.delete("/api/smart-furniture-hookups/hookup-1")

                    response.status shouldBe HttpStatusCode.Forbidden
                }
            }
        }
    })
