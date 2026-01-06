package io.energyconsumptionoptimizer.mapservice.storage.mongodb

import com.mongodb.ErrorCategory
import com.mongodb.MongoWriteException
import com.mongodb.client.model.FindOneAndReplaceOptions
import com.mongodb.client.model.ReplaceOptions
import com.mongodb.client.model.ReturnDocument
import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookup
import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.energyconsumptionoptimizer.mapservice.domain.Zone
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupAlreadyExistsException
import io.energyconsumptionoptimizer.mapservice.domain.errors.SmartFurnitureHookupIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneIDNotFoundException
import io.energyconsumptionoptimizer.mapservice.domain.errors.ZoneNameAlreadyExistsException
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.FloorPlanDocument
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.SmartFurnitureHookupDocument
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.documents.ZoneDocument
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.mapper.FloorPlanMapper
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.mapper.SmartFurnitureHookupMapper
import io.energyconsumptionoptimizer.mapservice.storage.mongodb.mapper.ZoneMapper
import kotlinx.coroutines.runBlocking
import org.litote.kmongo.coroutine.CoroutineClient
import org.litote.kmongo.coroutine.CoroutineCollection
import org.litote.kmongo.eq
import java.util.UUID

@Suppress("Detekt.TooManyFunctions")
class MongoHouseMapRepository(
    mongoClient: CoroutineClient,
    databaseName: String = "map-service",
) : HouseMapRepository {
    companion object {
        private const val FLOOR_PLAN_ID = "singleton-floor-plan"
    }

    private val floorPlanCollection: CoroutineCollection<FloorPlanDocument> =
        mongoClient.getDatabase(databaseName).getCollection<FloorPlanDocument>("floorPlans")
    private val zoneCollection: CoroutineCollection<ZoneDocument> =
        mongoClient.getDatabase(databaseName).getCollection<ZoneDocument>("zones")
    private val smartFurnitureHookupCollection: CoroutineCollection<SmartFurnitureHookupDocument> =
        mongoClient.getDatabase(databaseName).getCollection<SmartFurnitureHookupDocument>("smartFurnitureHookups")

    init {
        runBlocking {
            zoneCollection.ensureUniqueIndex(ZoneDocument::name)
        }
    }

    override suspend fun saveFloorPlan(floorPlan: FloorPlan): FloorPlan {
        val document = FloorPlanMapper.toDocument(floorPlan).copy(_id = FLOOR_PLAN_ID)

        floorPlanCollection.replaceOne(
            FloorPlanDocument::_id eq FLOOR_PLAN_ID,
            document,
            ReplaceOptions().upsert(true),
        )

        return FloorPlanMapper.toDomain(document)
    }

    override suspend fun saveZone(zone: Zone): Zone {
        println("Zone $zone")
        val document = ZoneMapper.toDocument(zone).copy(_id = UUID.randomUUID().toString())

        try {
            zoneCollection.insertOne(document)
        } catch (e: MongoWriteException) {
            if (e.error.category == ErrorCategory.DUPLICATE_KEY) {
                throw ZoneNameAlreadyExistsException(document.name)
            }
            throw e
        }
        return ZoneMapper.toDomain(document)
    }

    override suspend fun saveSmartFurnitureHookup(smartFurnitureHookup: SmartFurnitureHookup): SmartFurnitureHookup {
        val document =
            SmartFurnitureHookupMapper.toDocument(smartFurnitureHookup).let {
                if (it._id.isBlank()) {
                    it.copy(_id = UUID.randomUUID().toString())
                } else {
                    it
                }
            }

        try {
            smartFurnitureHookupCollection.insertOne(document)
        } catch (e: MongoWriteException) {
            if (e.error.category == ErrorCategory.DUPLICATE_KEY) {
                throw SmartFurnitureHookupAlreadyExistsException(document._id)
            }
            throw e
        }

        return SmartFurnitureHookupMapper.toDomain(document)
    }

    override suspend fun updateZone(zone: Zone): Zone {
        val document = ZoneMapper.toDocument(zone)

        val updatedDocument =
            zoneCollection.findOneAndReplace(
                ZoneDocument::_id eq zone.id.value,
                document,
                FindOneAndReplaceOptions().returnDocument(ReturnDocument.AFTER),
            ) ?: throw ZoneIDNotFoundException(zone.id.value)

        return ZoneMapper.toDomain(updatedDocument)
    }

    override suspend fun updateSmartFurnitureHookup(smartFurnitureHookup: SmartFurnitureHookup): SmartFurnitureHookup {
        val document = SmartFurnitureHookupMapper.toDocument(smartFurnitureHookup)

        val updatedDocument =
            smartFurnitureHookupCollection.findOneAndReplace(
                SmartFurnitureHookupDocument::_id eq smartFurnitureHookup.id.value,
                document,
                FindOneAndReplaceOptions().returnDocument(ReturnDocument.AFTER),
            ) ?: throw SmartFurnitureHookupIDNotFoundException(smartFurnitureHookup.id.value)

        return SmartFurnitureHookupMapper.toDomain(updatedDocument)
    }

    override suspend fun findFloorPlan(): FloorPlan? {
        val document = floorPlanCollection.findOne(FloorPlanDocument::_id eq FLOOR_PLAN_ID)
        return document?.let { FloorPlanMapper.toDomain(it) }
    }

    override suspend fun findAllZones(): List<Zone> = zoneCollection.find().toList().map { ZoneMapper.toDomain(it) }

    override suspend fun findZoneByID(id: ZoneID): Zone? {
        val document = zoneCollection.findOne(ZoneDocument::_id eq id.value)
        return document?.let { ZoneMapper.toDomain(it) }
    }

    override suspend fun findAllSmartFurnitureHookups(): List<SmartFurnitureHookup> =
        smartFurnitureHookupCollection
            .find()
            .toList()
            .map { SmartFurnitureHookupMapper.toDomain(it) }

    override suspend fun findAllSmartFurnitureHookupsOfZone(zoneID: ZoneID): List<SmartFurnitureHookup> =
        smartFurnitureHookupCollection
            .find(SmartFurnitureHookupDocument::zoneID eq zoneID.value)
            .toList()
            .map { SmartFurnitureHookupMapper.toDomain(it) }

    override suspend fun findSmartFurnitureHookupByID(id: SmartFurnitureHookupID): SmartFurnitureHookup? {
        val document =
            smartFurnitureHookupCollection.findOne(
                SmartFurnitureHookupDocument::_id eq id.value,
            )

        return document?.let { SmartFurnitureHookupMapper.toDomain(it) }
    }

    override suspend fun removeZone(id: ZoneID) {
        zoneCollection.findOneAndDelete(ZoneDocument::_id eq id.value)
            ?: throw ZoneIDNotFoundException(id.value)
    }

    override suspend fun removeSmartFurnitureHookup(id: SmartFurnitureHookupID) {
        smartFurnitureHookupCollection.findOneAndDelete(SmartFurnitureHookupDocument::_id eq id.value)
            ?: throw SmartFurnitureHookupIDNotFoundException(id.value)
    }
}
