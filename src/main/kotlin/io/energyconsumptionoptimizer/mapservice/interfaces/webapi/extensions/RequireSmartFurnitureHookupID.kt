package io.energyconsumptionoptimizer.mapservice.interfaces.webapi.extensions

import io.energyconsumptionoptimizer.mapservice.domain.SmartFurnitureHookupID
import io.ktor.server.application.ApplicationCall
import io.ktor.server.util.getOrFail

fun ApplicationCall.requireSmartFurnitureHookupID(): SmartFurnitureHookupID = SmartFurnitureHookupID(parameters.getOrFail("id"))
