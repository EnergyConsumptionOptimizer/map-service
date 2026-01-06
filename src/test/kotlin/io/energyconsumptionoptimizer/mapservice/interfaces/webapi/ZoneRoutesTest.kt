package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.energyconsumptionoptimizer.mapservice.application.ZoneServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.craftZone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.InvalidTokenException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.UnauthorizedException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.presentation.dto.PointDTO
import io.energyconsumptionoptimizer.mapservice.presentation.requests.CreateZoneRequest
import io.energyconsumptionoptimizer.mapservice.presentation.requests.UpdateZoneRequest
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

class ZoneRoutesTest :
    ShouldSpec({
        lateinit var zoneService: ZoneServiceImpl
        lateinit var authMiddleware: AuthMiddleware
        lateinit var routingDependencies: RoutingDependencies

        beforeEach {
            zoneService = mockk()
            authMiddleware = mockk()
            routingDependencies = mockk()

            every { routingDependencies.zoneServiceImpl } returns zoneService
            every { routingDependencies.authMiddleware } returns authMiddleware
            every { routingDependencies.floorPlanServiceImpl } returns mockk(relaxed = true)
            every { routingDependencies.houseMapServiceImpl } returns mockk(relaxed = true)
            every { routingDependencies.smartFurnitureHookupServiceImpl } returns mockk(relaxed = true)
        }

        afterEach {
            clearAllMocks()
        }
        context("POST /api/zones") {
            should("create zone successfully") {
                val zone = craftZone()
                val request =
                    CreateZoneRequest(
                        name = zone.name.value,
                        color = zone.color.value,
                        vertices = zone.vertices.map { PointDTO(it.x, it.y) },
                    )

                coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                coEvery { zoneService.createZone(any(), any(), any()) } returns zone

                testApplication {
                    application { configureApp(routingDependencies) }

                    val client = createJsonClient()

                    val response =
                        client.post("/api/zones") {
                            contentType(ContentType.Application.Json)
                            setBody(request)
                        }

                    response.status shouldBe HttpStatusCode.Created

                    coVerify(exactly = 1) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { zoneService.createZone(any(), any(), any()) }
                }
            }

            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response =
                        client.post("/api/zones") {
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
                        client.post("/api/zones") {
                            contentType(ContentType.Application.Json)
                            setBody("""{}""")
                        }

                    response.status shouldBe HttpStatusCode.Forbidden
                }
            }
        }
        context("GET /api/zones") {
            should("return all zones successfully") {
                val zones =
                    listOf(
                        craftZone(ZoneID("zone-1")),
                        craftZone(ZoneID("zone-2")),
                    )

                coEvery { authMiddleware.authenticate(any()) } just Runs
                coEvery { zoneService.getZones() } returns zones

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/zones")

                    response.status shouldBe HttpStatusCode.OK

                    response.bodyAsText() shouldContain "zone-1"
                    response.bodyAsText() shouldContain "zone-2"

                    coVerify(exactly = 1) { authMiddleware.authenticate(any()) }
                    coVerify(exactly = 0) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { zoneService.getZones() }
                }
            }

            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticate(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/zones")

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }
        }
        context("GET /api/zones/{id}") {
            should("return specific zone successfully") {
                val zone = craftZone(ZoneID("zone-1"))

                coEvery { authMiddleware.authenticate(any()) } just Runs
                coEvery { zoneService.getZone(any()) } returns zone

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/zones/zone-1")

                    response.status shouldBe HttpStatusCode.OK

                    response.bodyAsText() shouldContain zone.id.value

                    coVerify(exactly = 1) { authMiddleware.authenticate(any()) }
                    coVerify(exactly = 0) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { zoneService.getZone(any()) }
                }
            }

            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticate(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/zones/zone-1")

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }
        }
        context("PATCH /api/zones/{id}") {
            should("update zone successfully") {
                val zone = craftZone(ZoneID("zone-1"))
                val request =
                    UpdateZoneRequest(
                        name = zone.name.value,
                        color = zone.color.value,
                        vertices = zone.vertices.map { PointDTO(it.x, it.y) },
                    )

                coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                coEvery { zoneService.updateZone(any(), any(), any(), any()) } returns zone

                testApplication {
                    application { configureApp(routingDependencies) }

                    val client = createJsonClient()

                    val response =
                        client.patch("/api/zones/{id}") {
                            contentType(ContentType.Application.Json)
                            setBody(request)
                        }

                    response.status shouldBe HttpStatusCode.OK
                    response.bodyAsText() shouldContain zone.id.value

                    coVerify(exactly = 1) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { zoneService.updateZone(any(), any(), any(), any()) }
                }
            }
            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response =
                        client.patch("/api/zones/zone-1") {
                            contentType(ContentType.Application.Json)
                            setBody("""""")
                        }

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }
            should("fail for regular authenticated user without admin") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws UnauthorizedException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response =
                        client.patch("/api/zones/zone-1") {
                            contentType(ContentType.Application.Json)
                            setBody("""""")
                        }

                    response.status shouldBe HttpStatusCode.Forbidden
                }
            }
        }
        context("DELETE /api/zones/{id}") {
            should("delete zone successfully") {
                coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                coEvery { zoneService.deleteZone(any()) } just Runs

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.delete("/api/zones/zone-1")

                    response.status shouldBe HttpStatusCode.NoContent

                    coVerify(exactly = 1) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { zoneService.deleteZone(any()) }
                }
            }

            should("fail for non-authenticated user") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws InvalidTokenException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.delete("/api/zones/zone-1")

                    response.status shouldBe HttpStatusCode.Unauthorized
                }
            }

            should("fail for regular authenticated user without admin") {
                coEvery { authMiddleware.authenticateAdmin(any()) } throws UnauthorizedException()

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.delete("/api/zones/zone-1")

                    response.status shouldBe HttpStatusCode.Forbidden
                }
            }
        }
    })
