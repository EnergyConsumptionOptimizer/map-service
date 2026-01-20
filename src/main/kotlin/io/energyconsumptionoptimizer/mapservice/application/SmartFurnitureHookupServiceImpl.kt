package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.domain.Point
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupFactory
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.energyconsumptionoptimizer.mapservice.domain.ports.SmartFurnitureHookupService
import io.energyconsumptionoptimizer.mapservice.domain.utils.isPointInPolygon

class SmartFurnitureHookupServiceImpl(
    private val repository: HouseMapRepository,
) : SmartFurnitureHookupService {
    override suspend fun createSmartFurnitureHookup(
        id: SmartFurnitureHookupID,
        position: Pair<Double, Double>,
        zoneID: ZoneID?,
    ): SmartFurnitureHookup {
        val smartFurnitureHookup = SmartFurnitureHookupFactory.create(position, zoneID)
        smartFurnitureHookup.id = id

        if (zoneID != null) {
            getZoneOrFail(zoneID)
        } else {
            smartFurnitureHookup.zoneID = findZoneIDOfSmartFurnitureHookup(smartFurnitureHookup.position)
        }

        return repository.saveSmartFurnitureHookup(smartFurnitureHookup)
    }

    override suspend fun getSmartFurnitureHookups(): List<SmartFurnitureHookup> = repository.findAllSmartFurnitureHookups()

    override suspend fun getSmartFurnitureHookup(id: SmartFurnitureHookupID): SmartFurnitureHookup? =
        repository.findSmartFurnitureHookupByID(id)

    override suspend fun updateSmartFurnitureHookup(
        id: SmartFurnitureHookupID,
        position: Pair<Double, Double>?,
        zoneID: ZoneID?,
    ): SmartFurnitureHookup {
        val smartFurnitureHookup =
            repository.findSmartFurnitureHookupByID(id)
                ?: throw SmartFurnitureHookupIDNotFoundException(id.value)

        val targetPoint = position?.let { Point(it.first, it.second) } ?: smartFurnitureHookup.position

        val finalZoneID =
            when {
                zoneID != null -> {
                    val zone = getZoneOrFail(zoneID)

                    if (isPositionInZone(targetPoint, zone)) {
                        zoneID
                    } else {
                        findZoneIDOfSmartFurnitureHookup(targetPoint)
                    }
                }

                position != null -> {
                    findZoneIDOfSmartFurnitureHookup(targetPoint)
                }

                else -> {
                    smartFurnitureHookup.zoneID
                }
            }

        position?.let { smartFurnitureHookup.position = targetPoint }

        smartFurnitureHookup.zoneID = finalZoneID

        return repository.updateSmartFurnitureHookup(smartFurnitureHookup)
    }

    override suspend fun deleteSmartFurnitureHookup(id: SmartFurnitureHookupID) {
        repository.removeSmartFurnitureHookup(id)
    }

    private suspend fun getZoneOrFail(zoneID: ZoneID): Zone = repository.findZoneByID(zoneID) ?: throw ZoneIDNotFoundException(zoneID.value)

    private suspend fun findZoneIDOfSmartFurnitureHookup(point: Point): ZoneID? {
        val zones = repository.findAllZones()

        for (zone in zones) {
            if (isPointInPolygon(point, zone.vertices)) {
                return zone.id
            }
        }

        return null
    }

    private fun isPositionInZone(
        position: Point,
        zone: Zone,
    ): Boolean = isPointInPolygon(position, zone.vertices)
}
