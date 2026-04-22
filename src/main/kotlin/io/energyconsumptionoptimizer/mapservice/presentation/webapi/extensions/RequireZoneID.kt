package io.energyconsumptionoptimizer.mapservice.presentation.webapi.extensions

import io.energyconsumptionoptimizer.mapservice.domain.ZoneID
import io.ktor.server.application.ApplicationCall
import io.ktor.server.util.getOrFail

fun ApplicationCall.requireZoneID(): ZoneID = ZoneID(parameters.getOrFail("id"))
