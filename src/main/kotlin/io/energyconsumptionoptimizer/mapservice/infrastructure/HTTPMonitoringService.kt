package io.energyconsumptionoptimizer.mapservice.infrastructure

import io.energyconsumptionoptimizer.mapservice.application.outbound.MonitoringService
import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.ktor.client.HttpClient
import io.ktor.client.request.delete

class HTTPMonitoringService(
    private val httpClient: HttpClient,
    private val baseUrl: String,
) : MonitoringService {
    override suspend fun removeZoneIDFromMeasurements(zoneID: ZoneID) {
        httpClient.delete("$baseUrl/api/internal/measurements/zone-tags/${zoneID.value}")
    }
}
