package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.application.port.MonitoringService
import io.energyconsumptionoptimizer.mapservice.domain.Color
import io.energyconsumptionoptimizer.mapservice.domain.Point
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneFactory
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.ZoneName
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.energyconsumptionoptimizer.mapservice.domain.ports.ZoneService
import io.energyconsumptionoptimizer.mapservice.domain.utils.isPointInPolygon

class ZoneServiceImpl(
    private val repository: HouseMapRepository,
    private val monitoringService: MonitoringService,
) : ZoneService {
    override suspend fun createZone(
        name: String,
        colorHex: String,
        vertices: List<Pair<Double, Double>>,
    ): Zone {
        val zone = ZoneFactory.create(name, colorHex, vertices)

        val newZone = repository.saveZone(zone)

        assignHookupsToZone(newZone)

        return newZone
    }

    override suspend fun getZones(): List<Zone> = repository.findAllZones()

    override suspend fun getZone(id: ZoneID): Zone? = repository.findZoneByID(id)

    override suspend fun updateZone(
        id: ZoneID,
        name: String?,
        colorHex: String?,
        vertices: List<Pair<Double, Double>>?,
    ): Zone {
        val zone = repository.findZoneByID(id) ?: throw ZoneIDNotFoundException(id.value)

        name?.let { zone.name = ZoneName(name) }
        colorHex?.let { zone.color = Color(it) }

        if (vertices != null) {
            require(vertices.size >= 3) { "A zone must have at least 3 vertices" }
            zone.vertices = vertices.map { Point(it.first, it.second) }
        }

        val updatedZone = repository.updateZone(zone)

        if (vertices != null) {
            reassignHookupsForZoneChange(updatedZone)
        }

        return updatedZone
    }

    override suspend fun deleteZone(id: ZoneID) {
        repository.removeZone(id)

        removeAssignedHookupsToZone(id)

        monitoringService.removeZoneIDFromMeasurements(id)
    }

    private suspend fun updateSmartFurnitureHookupZoneID(
        sfh: SmartFurnitureHookup,
        zoneID: ZoneID?,
    ) {
        sfh.zoneID = zoneID
        repository.updateSmartFurnitureHookup(sfh)
    }

    private suspend fun assignHookupsToZone(newZone: Zone) {
        val allHookups = repository.findAllSmartFurnitureHookups()

        allHookups.forEach { sfh ->
            val isInZone = isPointInPolygon(sfh.position, newZone.vertices)

            if (isInZone) {
                updateSmartFurnitureHookupZoneID(sfh, newZone.id)
            }
        }
    }

    private suspend fun reassignHookupsForZoneChange(changedZone: Zone) {
        val allHookups = repository.findAllSmartFurnitureHookups()

        allHookups.forEach { sfh ->
            val isInChangedZone = isPointInPolygon(sfh.position, changedZone.vertices)

            when (sfh.zoneID) {
                changedZone.id if !isInChangedZone -> {
                    sfh.zoneID = null
                    repository.updateSmartFurnitureHookup(sfh)
                }

                null if isInChangedZone -> {
                    updateSmartFurnitureHookupZoneID(sfh, changedZone.id)
                }
            }
        }
    }

    private suspend fun removeAssignedHookupsToZone(zoneID: ZoneID) {
        val allHookups = repository.findAllSmartFurnitureHookupsOfZone(zoneID)

        allHookups.forEach { sfh ->
            updateSmartFurnitureHookupZoneID(sfh, null)
            sfh.zoneID = null
        }
    }
}
