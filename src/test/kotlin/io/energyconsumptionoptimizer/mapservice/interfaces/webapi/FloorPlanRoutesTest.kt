package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.energyconsumptionoptimizer.mapservice.application.FloorPlanServiceImpl
import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanFormatNotValidException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.InvalidTokenException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.errors.UnauthorizedException
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.energyconsumptionoptimizer.mapservice.presentation.requests.UploadSvgRequest
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.get
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

class FloorPlanRoutesTest :
    ShouldSpec(
        {
            lateinit var floorPlanService: FloorPlanServiceImpl
            lateinit var authMiddleware: AuthMiddleware
            lateinit var routingDependencies: RoutingDependencies

            beforeEach {
                floorPlanService = mockk()
                authMiddleware = mockk()
                routingDependencies = mockk()

                every { routingDependencies.floorPlanServiceImpl } returns floorPlanService
                every { routingDependencies.authMiddleware } returns authMiddleware
                every { routingDependencies.houseMapServiceImpl } returns mockk(relaxed = true)
                every { routingDependencies.zoneServiceImpl } returns mockk(relaxed = true)
                every { routingDependencies.smartFurnitureHookupServiceImpl } returns mockk(relaxed = true)
            }

            afterEach {
                clearAllMocks()
            }

            context("POST /api/floor-plan") {
                should("create floor plan with valid SVG content") {
                    val svgContent = "<svg><rect width='100' height='100'/></svg>"

                    val uploadRequest =
                        UploadSvgRequest(
                            svgContent = svgContent,
                        )
                    val floorPlan = FloorPlan(svgContent)

                    coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                    coEvery { floorPlanService.createFloorPlan(svgContent) } returns floorPlan

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }

                        val client = createJsonClient()

                        val response =
                            client.post("/api/floor-plan") {
                                contentType(ContentType.Application.Json)
                                setBody(uploadRequest)
                            }

                        response.status shouldBe HttpStatusCode.Created

                        val body = response.bodyAsText()
                        body shouldContain "svgContent"
                        body shouldContain svgContent

                        coVerify(exactly = 1) { authMiddleware.authenticateAdmin(any()) }
                        coVerify(exactly = 1) { floorPlanService.createFloorPlan(svgContent) }
                    }
                }

                should("return 400 when svgContent format is invalid ") {
                    coEvery { authMiddleware.authenticateAdmin(any()) } just Runs
                    coEvery { floorPlanService.createFloorPlan(any()) } throws
                        FlorPlanFormatNotValidException()

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }
                        val client = createJsonClient()
                        val response =
                            client.post("/api/floor-plan?svgContent=invalid_content") {
                                contentType(ContentType.Application.Json)
                                setBody(
                                    UploadSvgRequest(
                                        svgContent = "invalid request",
                                    ),
                                )
                            }

                        response.status shouldBe HttpStatusCode.BadRequest
                    }
                }

                should("return 400 when svgContent parameter is missing") {
                    coEvery { authMiddleware.authenticateAdmin(any()) } just Runs

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }
                        val client = createJsonClient()
                        val response =
                            client.post("/api/floor-plan") {
                                contentType(ContentType.Application.Json)
                                setBody("""{}""")
                            }

                        response.status shouldBe HttpStatusCode.BadRequest
                    }
                }

                should("return 401 when authentication fails") {
                    coEvery { authMiddleware.authenticateAdmin(any()) } throws
                        InvalidTokenException()

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }

                        val response = client.post("/api/floor-plan")

                        response.status shouldBe HttpStatusCode.Unauthorized
                        coVerify(exactly = 0) { floorPlanService.createFloorPlan(any()) }
                    }
                }

                should("return 403 when user is not admin") {
                    coEvery { authMiddleware.authenticateAdmin(any()) } throws
                        UnauthorizedException()

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }

                        val response = client.post("/api/floor-plan")

                        response.status shouldBe HttpStatusCode.Forbidden

                        coVerify(exactly = 0) { floorPlanService.createFloorPlan(any()) }
                    }
                }
            }
            context("GET /api/floor-plan") {
                should("return floor plan when it exists") {
                    val svgContent = "<svg><rect width='100' height='100'/></svg>"
                    val floorPlan = FloorPlan(svgContent)

                    coEvery { authMiddleware.authenticate(any()) } just Runs
                    coEvery { floorPlanService.getFloorPlan() } returns floorPlan

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }

                        val response = client.get("/api/floor-plan")

                        response.status shouldBe HttpStatusCode.OK

                        val body = response.bodyAsText()
                        body shouldContain "svgContent"
                        body shouldContain svgContent

                        coVerify(exactly = 1) { floorPlanService.getFloorPlan() }
                    }
                }
                should("return 404 when floor plan does not exist") {
                    coEvery { authMiddleware.authenticate(any()) } just Runs
                    coEvery { floorPlanService.getFloorPlan() } returns null

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }

                        val response = client.get("/api/floor-plan")

                        response.status shouldBe HttpStatusCode.NotFound

                        coVerify(exactly = 1) { floorPlanService.getFloorPlan() }
                    }
                }
                should("return 401 when authentication fails") {
                    coEvery { authMiddleware.authenticate(any()) } throws InvalidTokenException()

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }

                        val response = client.get("/api/floor-plan")

                        response.status shouldBe HttpStatusCode.Unauthorized

                        coVerify(exactly = 0) { floorPlanService.getFloorPlan() }
                    }
                }
                should("work with valid non admin authentication") {
                    val svgContent = "<svg></svg>"
                    val floorPlan = FloorPlan(svgContent)

                    coEvery { authMiddleware.authenticate(any()) } just Runs
                    coEvery { floorPlanService.getFloorPlan() } returns floorPlan

                    testApplication {
                        application {
                            configureApp(routingDependencies)
                        }

                        val response = client.get("/api/floor-plan")

                        response.status shouldBe HttpStatusCode.OK

                        coVerify(exactly = 1) { authMiddleware.authenticate(any()) }
                        coVerify(exactly = 0) { authMiddleware.authenticateAdmin(any()) }
                    }
                }
            }
        },
    )
