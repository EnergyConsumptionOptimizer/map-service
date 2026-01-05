package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.domain.Color
import io.energyconsumptionoptimizer.mapservice.domain.Point
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneName
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.Runs
import io.mockk.clearAllMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.just
import io.mockk.mockk

data class ZoneTestInput(
    val name: String = "Living Room",
    val colorHex: String = "#FF5733",
    val vertices: List<Pair<Double, Double>> =
        listOf(
            0.0 to 0.0,
            10.0 to 0.0,
            10.0 to 10.0,
            0.0 to 10.0,
        ),
)

fun craftZone(
    id: ZoneID = ZoneID("zone-123"),
    name: ZoneName = ZoneName("Test Zone"),
    color: Color = Color("#FF5733"),
    vertices: List<Point> = listOf(Point(0.0, 0.0), Point(1.0, 0.0), Point(1.0, 1.0)),
): Zone =
    Zone(
        id = id,
        name = name,
        color = color,
        vertices = vertices,
    )

class ZoneServiceImplTest :
    ShouldSpec({
        lateinit var repository: HouseMapRepository
        lateinit var zoneService: ZoneServiceImpl

        beforeEach {
            repository = mockk()
            zoneService = ZoneServiceImpl(repository)
        }

        afterEach {
            clearAllMocks()
        }

        context("createZone") {
            should("create a zone and save it to repository") {
                val input = ZoneTestInput()

                val name = input.name
                val colorHex = input.colorHex
                val vertices = input.vertices

                val savedZone =
                    Zone(
                        id = ZoneID("zone-123"),
                        name = ZoneName(name),
                        color = Color(colorHex),
                        vertices = vertices.map { Point(it.first, it.second) },
                    )

                coEvery { repository.saveZone(any()) } returns savedZone
                coEvery { repository.findAllSmartFurnitureHookups() } returns emptyList()

                val result = zoneService.createZone(name, colorHex, vertices)

                result.id shouldBe ZoneID("zone-123")
                result.name.value shouldBe name
                result.color.value shouldBe colorHex

                coVerify(exactly = 1) { repository.saveZone(any()) }
                coVerify(exactly = 1) { repository.findAllSmartFurnitureHookups() }
            }

            should("throw error when vertices have less than 3 points") {
                val input = ZoneTestInput(vertices = listOf(0.0 to 0.0, 10.0 to 0.0))

                shouldThrow<IllegalArgumentException> {
                    zoneService.createZone(input.name, input.colorHex, input.vertices)
                }
            }

            should("throw error when color is not an hex color") {
                val input = ZoneTestInput(colorHex = "FF5733")

                shouldThrow<IllegalArgumentException> {
                    zoneService.createZone(input.name, input.colorHex, input.vertices)
                }
            }

            should("throw error when zone name is blank") {
                val input = ZoneTestInput(name = "")

                shouldThrow<IllegalArgumentException> {
                    zoneService.createZone(input.name, input.colorHex, input.vertices)
                }
            }
        }

        context("getZones") {
            should("should return all zones from repository") {
                val zones =
                    listOf(
                        craftZone(id = ZoneID("1")),
                        craftZone(id = ZoneID("2")),
                    )

                coEvery { repository.findAllZones() } returns zones

                val result = zoneService.getZones()

                result shouldHaveSize 2
                result shouldContain zones[0]
                result shouldContain zones[1]
                coVerify(exactly = 1) { repository.findAllZones() }
            }
        }

        context("getZone") {
            should("should return zone by ID") {
                val zone = craftZone()

                coEvery { repository.findZoneByID(zone.id) } returns zone

                val result = zoneService.getZone(zone.id)

                result shouldNotBe null
                result?.id shouldBe zone.id
                coVerify(exactly = 1) { repository.findZoneByID(zone.id) }
            }

            should("return null when zone not found") {
                val zoneId = ZoneID("non-existent")

                coEvery { repository.findZoneByID(zoneId) } returns null

                val result = zoneService.getZone(zoneId)

                result shouldBe null
                coVerify(exactly = 1) { repository.findZoneByID(zoneId) }
            }
        }

        context("updateZone") {
            should("update zone name") {
                val zone = craftZone()
                val newName = "New name"

                coEvery { repository.findZoneByID(zone.id) } returns zone
                coEvery { repository.updateZone(any()) } coAnswers {
                    firstArg()
                }

                val result = zoneService.updateZone(zone.id, name = newName)

                result.name.value shouldBe newName
                coVerify(exactly = 1) { repository.updateZone(any()) }
            }

            should("update zone color") {
                val zone = craftZone()
                val newColor = "#00FF00"

                coEvery { repository.findZoneByID(zone.id) } returns zone
                coEvery { repository.updateZone(any()) } coAnswers {
                    firstArg()
                }

                val result = zoneService.updateZone(zone.id, colorHex = newColor)

                result.color.value shouldBe newColor
                coVerify(exactly = 1) { repository.updateZone(any()) }
            }

            should("update vertices and reassign hookups") {
                val zone = craftZone()

                val newVertices = listOf(0.0 to 0.0, 20.0 to 0.0, 20.0 to 20.0, 0.0 to 20.0)

                val hookup =
                    SmartFurnitureHookup(
                        id = SmartFurnitureHookupID("hookup-1"),
                        position = Point(15.0, 15.0),
                        zoneID = null,
                    )

                coEvery { repository.findZoneByID(zone.id) } returns zone
                coEvery { repository.updateZone(any()) } coAnswers {
                    firstArg()
                }
                coEvery { repository.findAllSmartFurnitureHookups() } returns listOf(hookup)
                coEvery { repository.updateSmartFurnitureHookup(any()) } returns hookup

                zoneService.updateZone(zone.id, vertices = newVertices)

                coVerify(exactly = 1) { repository.updateZone(any()) }
                coVerify(exactly = 1) { repository.findAllSmartFurnitureHookups() }
                coVerify(exactly = 1) { repository.updateSmartFurnitureHookup(any()) }
            }

            should("throw error when zone not found") {
                val zoneId = ZoneID("non-existent")
                coEvery { repository.findZoneByID(zoneId) } returns null

                shouldThrow<Error> {
                    zoneService.updateZone(zoneId, name = "New Name")
                }
            }

            should("throw error when vertices have less than 3 points") {
                val zone = craftZone()

                val invalidVertices = listOf(0.0 to 0.0, 10.0 to 0.0)

                coEvery { repository.findZoneByID(zone.id) } returns zone

                shouldThrow<IllegalArgumentException> {
                    zoneService.updateZone(zone.id, vertices = invalidVertices)
                }
            }
        }

        context("deleteZone") {
            should("delete zones and unassign hookups") {
                val zone = craftZone()

                val hookups =
                    listOf(
                        SmartFurnitureHookup(
                            id = SmartFurnitureHookupID("hookup-1"),
                            position = Point(5.0, 5.0),
                            zoneID = zone.id,
                        ),
                    )

                coEvery { repository.removeZone(zone.id) } just Runs
                coEvery { repository.findAllSmartFurnitureHookupsOfZone(zone.id) } returns hookups
                coEvery { repository.updateSmartFurnitureHookup(any()) } returns hookups[0]

                // When
                zoneService.deleteZone(zone.id)

                // Then
                coVerify(exactly = 1) { repository.removeZone(zone.id) }
                coVerify(exactly = 1) { repository.findAllSmartFurnitureHookupsOfZone(zone.id) }
                coVerify(exactly = 1) {
                    repository.updateSmartFurnitureHookup(any())
                }
            }
        }
    })
