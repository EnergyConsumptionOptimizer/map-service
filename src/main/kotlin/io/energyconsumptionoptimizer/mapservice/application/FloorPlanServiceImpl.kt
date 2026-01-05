package io.energyconsumptionoptimizer.mapservice.application

import io.energyconsumptionoptimizer.mapservice.domain.FloorPlan
import io.energyconsumptionoptimizer.mapservice.domain.errors.FlorPlanFormatNotValidException
import io.energyconsumptionoptimizer.mapservice.domain.ports.FloorPlanService
import io.energyconsumptionoptimizer.mapservice.domain.ports.HouseMapRepository
import org.xml.sax.InputSource
import java.io.StringReader
import javax.xml.parsers.DocumentBuilderFactory

class FloorPlanServiceImpl(
    private val repository: HouseMapRepository,
) : FloorPlanService {
    override suspend fun createFloorPlan(floorPlanSVG: String): FloorPlan {
        if (!isValidSVG(floorPlanSVG)) {
            throw FlorPlanFormatNotValidException()
        }

        val floorPlan = FloorPlan(floorPlanSVG)
        return repository.saveFloorPlan(floorPlan)
    }

    override suspend fun getFloorPlan(): FloorPlan? = repository.findFloorPlan()

    private fun isValidSVG(svg: String): Boolean =
        try {
            val factory = DocumentBuilderFactory.newInstance()

            val builder = factory.newDocumentBuilder()
            val inputSource = InputSource(StringReader(svg))
            val document = builder.parse(inputSource)

            val root = document.documentElement
            root != null && root.tagName.equals("svg", ignoreCase = true)
        } catch (_: Exception) {
            false
        }
}
