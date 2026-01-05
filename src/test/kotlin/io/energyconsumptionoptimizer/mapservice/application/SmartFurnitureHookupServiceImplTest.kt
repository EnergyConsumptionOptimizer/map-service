package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.domain.Point
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.string.shouldContain
import io.mockk.Runs
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.just
import io.mockk.mockk

fun craftSmartFurnitureHookup(
    id: SmartFurnitureHookupID = SmartFurnitureHookupID("sfh-123"),
    position: Point = Point(1.0, 0.0),
    zoneID: ZoneID? = null,
): SmartFurnitureHookup =
    SmartFurnitureHookup(
        id = id,
        position = position,
        zoneID = zoneID,
    )

class SmartFurnitureHookupServiceImplTest :
    ShouldSpec(
        {
            lateinit var repository: HouseMapRepository
            lateinit var hookupService: SmartFurnitureHookupServiceImpl

            beforeEach {
                repository = mockk()
                hookupService = SmartFurnitureHookupServiceImpl(repository)
            }

            afterEach {
                clearAllMocks()
            }

            context("createSmartFurnitureHookup") {
                should("create hookup without zone assignment") {
                    val smartFurnitureHookup = craftSmartFurnitureHookup()

                    val id = smartFurnitureHookup.id
                    val position = smartFurnitureHookup.position
                    val zoneID = smartFurnitureHookup.zoneID

                    val savedHookup =
                        SmartFurnitureHookup(
                            id = id,
                            position = position,
                            zoneID = zoneID,
                        )

                    coEvery { repository.saveSmartFurnitureHookup(any()) } returns savedHookup

                    val result = hookupService.createSmartFurnitureHookup(id, position.let { it.x to it.y }, null)

                    result.id shouldBe id
                    result.position.x shouldBe position.x
                    result.position.y shouldBe position.y
                    result.zoneID shouldBe zoneID

                    coVerify(exactly = 1) { repository.saveSmartFurnitureHookup(any()) }
                    coVerify(exactly = 0) { repository.findZoneByID(any()) }
                }

                should("create hookup with zone assignment when zone exists") {
                    val smartFurnitureHookup = craftSmartFurnitureHookup(position = Point(5.0, 5.0))

                    val zone = craftZone(vertices = listOf(Point(0.0, 0.0), Point(10.0, 0.0), Point(10.0, 10.0)))

                    val savedHookup =
                        SmartFurnitureHookup(
                            id = smartFurnitureHookup.id,
                            position = smartFurnitureHookup.position,
                            zoneID = zone.id,
                        )

                    coEvery { repository.findZoneByID(zone.id) } returns zone
                    coEvery { repository.saveSmartFurnitureHookup(any()) } returns savedHookup

                    val result =
                        hookupService.createSmartFurnitureHookup(
                            smartFurnitureHookup.id,
                            smartFurnitureHookup.position.let { it.x to it.y },
                            zone.id,
                        )

                    result.id shouldBe savedHookup.id
                    result.zoneID shouldBe savedHookup.zoneID

                    coVerify(exactly = 1) { repository.findZoneByID(zone.id) }
                    coVerify(exactly = 1) { repository.saveSmartFurnitureHookup(any()) }
                }

                should("throw exception when zone does not exist") {
                    val zoneID = ZoneID("non-existent")
                    val smartFurnitureHookup = craftSmartFurnitureHookup(zoneID = zoneID)

                    coEvery { repository.findZoneByID(zoneID) } returns null

                    shouldThrow<ZoneIDNotFoundException> {
                        hookupService.createSmartFurnitureHookup(
                            smartFurnitureHookup.id,
                            smartFurnitureHookup.position.let { it.x to it.y },
                            zoneID,
                        )
                    }

                    coVerify(exactly = 1) { repository.findZoneByID(zoneID) }
                    coVerify(exactly = 0) { repository.saveSmartFurnitureHookup(any()) }
                }
            }

            context("getSmartFurnitureHookups") {
                should("return all hookups") {
                    val hookups =
                        listOf(
                            craftSmartFurnitureHookup(id = SmartFurnitureHookupID("hookup-1"), zoneID = ZoneID("1")),
                            craftSmartFurnitureHookup(id = SmartFurnitureHookupID("hookup-2")),
                        )

                    coEvery { repository.findAllSmartFurnitureHookups() } returns hookups

                    val result = hookupService.getSmartFurnitureHookups()

                    result shouldHaveSize 2
                    result shouldContainExactly hookups

                    coVerify(exactly = 1) { repository.findAllSmartFurnitureHookups() }
                }
            }

            context("getSmartFurnitureHookup") {
                should("return hookup when it exists") {
                    val hookup = craftSmartFurnitureHookup()

                    coEvery { repository.findSmartFurnitureHookupByID(hookup.id) } returns hookup

                    val result = hookupService.getSmartFurnitureHookup(hookup.id)

                    result shouldNotBe null
                    result?.id shouldBe hookup.id

                    coVerify(exactly = 1) { repository.findSmartFurnitureHookupByID(hookup.id) }
                }

                should("return null when hookup does not exist") {
                    val id = SmartFurnitureHookupID("non-existent")

                    coEvery { repository.findSmartFurnitureHookupByID(id) } returns null

                    val result = hookupService.getSmartFurnitureHookup(id)

                    result shouldBe null
                    coVerify(exactly = 1) { repository.findSmartFurnitureHookupByID(id) }
                }
            }

            context("updateSmartFurnitureHookup") {
                should("throw exception when hookup does not exist") {
                    val id = SmartFurnitureHookupID("non-existent")

                    coEvery { repository.findSmartFurnitureHookupByID(id) } returns null

                    val exception =
                        shouldThrow<SmartFurnitureHookupIDNotFoundException> {
                            hookupService.updateSmartFurnitureHookup(id, 5.0 to 5.0, null)
                        }

                    exception.message shouldContain "non-existent"
                    coVerify(exactly = 0) { repository.updateSmartFurnitureHookup(any()) }
                }

                should("update position only and auto-detect zone") {
                    val hookup = craftSmartFurnitureHookup()

                    val newPosition = 5.0 to 5.0

                    val zone =
                        craftZone(
                            vertices =
                                listOf(
                                    Point(0.0, 0.0),
                                    Point(10.0, 0.0),
                                    Point(10.0, 10.0),
                                    Point(0.0, 10.0),
                                ),
                        )

                    coEvery { repository.findSmartFurnitureHookupByID(hookup.id) } returns hookup
                    coEvery { repository.findAllZones() } returns listOf(zone)
                    coEvery { repository.updateSmartFurnitureHookup(any()) } coAnswers {
                        firstArg()
                    }

                    val result = hookupService.updateSmartFurnitureHookup(hookup.id, newPosition, null)

                    result.position.x shouldBe newPosition.first
                    result.position.y shouldBe newPosition.second
                    result.zoneID shouldBe zone.id

                    coVerify(exactly = 1) { repository.findAllZones() }
                    coVerify(exactly = 1) { repository.updateSmartFurnitureHookup(any()) }
                }

                should("update position only and not assign any zone") {
                    val hookup = craftSmartFurnitureHookup()

                    val newPosition = 20.0 to 20.0

                    val zone =
                        craftZone(
                            vertices =
                                listOf(
                                    Point(0.0, 0.0),
                                    Point(10.0, 0.0),
                                    Point(10.0, 10.0),
                                    Point(0.0, 10.0),
                                ),
                        )

                    coEvery { repository.findSmartFurnitureHookupByID(hookup.id) } returns hookup
                    coEvery { repository.findAllZones() } returns listOf(zone)
                    coEvery { repository.updateSmartFurnitureHookup(any()) } coAnswers {
                        firstArg()
                    }

                    val result = hookupService.updateSmartFurnitureHookup(hookup.id, newPosition, null)

                    result.position.x shouldBe newPosition.first
                    result.position.y shouldBe newPosition.second
                    result.zoneID shouldBe null

                    coVerify(exactly = 1) { repository.findAllZones() }
                    coVerify(exactly = 1) { repository.updateSmartFurnitureHookup(any()) }
                }

                should("update zone assignment when zone exists and position is inside it") {
                    val hookup = craftSmartFurnitureHookup()
                    val targetZoneID = ZoneID("zone-1")
                    val zone =
                        craftZone(
                            id = targetZoneID,
                            vertices = listOf(Point(0.0, 0.0), Point(10.0, 0.0), Point(10.0, 10.0), Point(0.0, 10.0)),
                        )

                    coEvery { repository.findSmartFurnitureHookupByID(hookup.id) } returns hookup
                    coEvery { repository.findZoneByID(targetZoneID) } returns zone
                    coEvery { repository.updateSmartFurnitureHookup(any()) } coAnswers {
                        firstArg()
                    }

                    val result = hookupService.updateSmartFurnitureHookup(hookup.id, zoneID = targetZoneID)

                    result.zoneID shouldBe targetZoneID

                    coVerify(exactly = 1) { repository.findZoneByID(targetZoneID) }
                    coVerify(exactly = 1) { repository.updateSmartFurnitureHookup(any()) }
                }

                should("throw exception when updating to non-existent zone") {
                    val hookup = craftSmartFurnitureHookup()
                    val zoneID = ZoneID("non-existent")

                    coEvery { repository.findSmartFurnitureHookupByID(hookup.id) } returns hookup
                    coEvery { repository.findZoneByID(zoneID) } returns null

                    shouldThrow<ZoneIDNotFoundException> {
                        hookupService.updateSmartFurnitureHookup(hookup.id, null, zoneID)
                    }

                    coVerify(exactly = 0) { repository.updateSmartFurnitureHookup(any()) }
                }
            }

            context("deleteSmartFurnitureHookup") {
                should("delete hookup") {
                    val id = SmartFurnitureHookupID("hookup-1")

                    coEvery { repository.removeSmartFurnitureHookup(id) } just Runs

                    hookupService.deleteSmartFurnitureHookup(id)

                    coVerify(exactly = 1) { repository.removeSmartFurnitureHookup(id) }
                }
            }
        },
    )
