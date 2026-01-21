package io.energyconsumptionoptimizer.mapservice

import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.netty.NettyApplicationEngine
import kotlin.system.exitProcess

private val PORT = System.getenv("PORT")?.toIntOrNull() ?: 3003

private const val SHUTDOWN_GRACE_PERIOD_MS = 1000L
private const val SHUTDOWN_TIMEOUT_MS = 2000L

fun main() {
    try {
        val config = loadConfiguration()
        val dependencies = Dependencies(config)

        initializeDatabase(dependencies)

        val server = createServer(dependencies)
        registerShutdownHook(dependencies, server)
        startServer(server)
    } catch (_: Exception) {
        exitProcess(1)
    }
}

private fun loadConfiguration(): AppConfig {
    val mongoHost = System.getenv("MONGODB_HOST") ?: "localhost"
    val mongoPort = System.getenv("MONGODB_PORT") ?: "27017"
    val mongoDbName = System.getenv("MONGO_DB") ?: "mapservice"
    val mongoUri = "mongodb://$mongoHost:$mongoPort"

    val userHost = System.getenv("USER_SERVICE_HOST") ?: "localhost"
    val userPort = System.getenv("USER_SERVICE_PORT") ?: "3000"

    val monitoringHost = System.getenv("MONITORING_SERVICE_HOST") ?: "localhost"
    val monitoringPort = System.getenv("MONITORING_SERVICE_PORT") ?: "3004"

    return AppConfig(
        mongoUri = mongoUri,
        mongoDatabase = mongoDbName,
        userServiceUrl = System.getenv("USER_SERVICE_URL") ?: "http://$userHost:$userPort",
        monitoringServiceUrl = System.getenv("MONITORING_SERVICE_URL") ?: "http://$monitoringHost:$monitoringPort",
    )
}

private fun initializeDatabase(dependencies: Dependencies) {
    dependencies.mongoClient
}

private fun createServer(dependencies: Dependencies) =
    embeddedServer(Netty, PORT) {
        module(dependencies)
    }

private fun registerShutdownHook(
    dependencies: Dependencies,
    server: EmbeddedServer<NettyApplicationEngine, *>?,
) {
    Runtime.getRuntime().addShutdownHook(
        Thread {
            dependencies.shutdown()
            server?.stop(SHUTDOWN_GRACE_PERIOD_MS, SHUTDOWN_TIMEOUT_MS)
        },
    )
}

private fun startServer(server: EmbeddedServer<NettyApplicationEngine, *>?) {
    if (server != null) {
        server.start(wait = true)
    } else {
        Thread.currentThread().join()
    }
}
