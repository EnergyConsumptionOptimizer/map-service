package io.energyconsumptionoptimizer.mapservice.interfaces.webapi

import io.energyconsumptionoptimizer.mapservice.application.SmartFurnitureHookupServiceImpl
import io.energyconsumptionoptimizer.mapservice.application.craftSmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.interfaces.webapi.middleware.AuthMiddleware
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk

// CPD-OFF
class InternalSmartFurnitureHookupRoutesTest :
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
        // CPD-ON
        afterEach {
            clearAllMocks()
        }

        context("GET /api/internal/smart-furniture-hookups/{id}") {
            should("return specific hookup successfully") {
                val hookup = craftSmartFurnitureHookup(SmartFurnitureHookupID("hookup-1"))

                coEvery { hookupService.getSmartFurnitureHookup(any()) } returns hookup

                testApplication {
                    application { configureApp(routingDependencies) }

                    val response = client.get("/api/internal/smart-furniture-hookups/hookup-1")

                    response.status shouldBe HttpStatusCode.OK
                    response.bodyAsText() shouldContain "hookup-1"

                    coVerify(exactly = 0) { authMiddleware.authenticate(any()) }
                    coVerify(exactly = 0) { authMiddleware.authenticateAdmin(any()) }
                    coVerify(exactly = 1) { hookupService.getSmartFurnitureHookup(any()) }
                }
            }
        }
    })
