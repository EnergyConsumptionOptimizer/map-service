package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.FloorPlanService
import io.energyconsumptionoptimizer.mapservice.domain.ports.SmartFurnitureHookupService
import io.energyconsumptionoptimizer.mapservice.domain.ports.ZoneService
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk

class HouseMapServiceImplTest :
    ShouldSpec({
        lateinit var floorPlanService: FloorPlanService
        lateinit var zoneService: ZoneService
        lateinit var smartFurnitureHookupService: SmartFurnitureHookupService
        lateinit var houseMapService: HouseMapServiceImpl

        beforeEach {
            floorPlanService = mockk()
            zoneService = mockk()
            smartFurnitureHookupService = mockk()
            houseMapService =
                HouseMapServiceImpl(
                    floorPlanService,
                    zoneService,
                    smartFurnitureHookupService,
                )
        }

        afterEach {
            clearAllMocks()
        }

        context("getHouseMap") {
            should("return complete house map with all components") {
                val floorPlan = FloorPlan("<svg><rect width='100' height='100'/></svg>")
                val zones =
                    listOf(
                        craftZone(id = ZoneID("1")),
                        craftZone(id = ZoneID("2")),
                    )
                val hookups =
                    listOf(
                        craftSmartFurnitureHookup(id = SmartFurnitureHookupID("hookup-1"), zoneID = ZoneID("1")),
                        craftSmartFurnitureHookup(id = SmartFurnitureHookupID("hookup-2")),
                    )
                coEvery { floorPlanService.getFloorPlan() } returns floorPlan
                coEvery { zoneService.getZones() } returns zones
                coEvery { smartFurnitureHookupService.getSmartFurnitureHookups() } returns hookups

                val result = houseMapService.getHouseMap()

                result shouldNotBe null
                result.floorPlan shouldBe floorPlan
                result.zones shouldHaveSize 2
                result.zones shouldContainExactly zones
                result.smartFurnitureHookups shouldHaveSize 2
                result.smartFurnitureHookups shouldContainExactly hookups

                coVerify(exactly = 1) { floorPlanService.getFloorPlan() }
                coVerify(exactly = 1) { zoneService.getZones() }
                coVerify(exactly = 1) { smartFurnitureHookupService.getSmartFurnitureHookups() }
            }

            should("throw error when floor plan does not exist") {
                coEvery { floorPlanService.getFloorPlan() } returns null

                shouldThrow<FlorPlanNotFoundException> {
                    houseMapService.getHouseMap()
                }

                coVerify(exactly = 1) { floorPlanService.getFloorPlan() }
                coVerify(exactly = 0) { zoneService.getZones() }
                coVerify(exactly = 0) { smartFurnitureHookupService.getSmartFurnitureHookups() }
            }
        }
    })
