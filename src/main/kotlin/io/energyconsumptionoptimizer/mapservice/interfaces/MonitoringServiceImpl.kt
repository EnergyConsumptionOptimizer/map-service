package io.energyconsumptionoptimizer.mapservice.interfaces
import io.energyconsumptionoptimizer.mapservice.application.port.MonitoringService
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.ktor.client.HttpClient
import io.ktor.client.request.delete

class MonitoringServiceImpl(
    private val httpClient: HttpClient,
    private val baseUrl: String,
) : MonitoringService {
    override suspend fun removeZoneIDFromMeasurements(zoneID: ZoneID) {
        httpClient.delete("$baseUrl/api/internal/measurements/zone-tags/${zoneID.value}")
    }
}
