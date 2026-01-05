package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanFormatNotValidException
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk

class FloorPlanServiceImplTest :
    ShouldSpec(
        {
            lateinit var repository: HouseMapRepository
            lateinit var floorPlanService: FloorPlanServiceImpl

            val svgContent = "<svg><rect width='100' height='100'/></svg>"

            beforeEach {
                repository = mockk()
                floorPlanService = FloorPlanServiceImpl(repository)
            }

            afterEach {
                clearAllMocks()
            }

            context("createFloorPlan") {
                should("create and save a floor plan with valid SVG content") {
                    val savedFloorPlan = FloorPlan(svgContent)

                    coEvery { repository.saveFloorPlan(any()) } returns savedFloorPlan

                    val result = floorPlanService.createFloorPlan(svgContent)

                    result.svgContent shouldBe svgContent
                    coVerify(exactly = 1) { repository.saveFloorPlan(match { it.svgContent == svgContent }) }
                }
                should("throw exception when SVG content is empty") {
                    val emptySvgContent = ""

                    shouldThrow<FlorPlanFormatNotValidException> {
                        floorPlanService.createFloorPlan(emptySvgContent)
                    }

                    coVerify(exactly = 0) { repository.saveFloorPlan(any()) }
                }
            }

            context("getFloorPlan") {
                should("return floor plan when it exists") {
                    val existingFloorPlan = FloorPlan(svgContent)

                    coEvery { repository.findFloorPlan() } returns existingFloorPlan

                    val result = floorPlanService.getFloorPlan()

                    result shouldNotBe null
                    result?.svgContent shouldBe svgContent
                    coVerify(exactly = 1) { repository.findFloorPlan() }
                }
                should("return null when floor plan does not exist") {
                    coEvery { repository.findFloorPlan() } returns null

                    val result = floorPlanService.getFloorPlan()

                    result shouldBe null
                    coVerify(exactly = 1) { repository.findFloorPlan() }
                }
            }
        },
    )
