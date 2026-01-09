package io.energyconsumptionoptimizer.mapservice

import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.netty.NettyApplicationEngine
import kotlin.system.exitProcess
import kotlin.text.toIntOrNull

private val PORT = System.getenv("PORT")?.toIntOrNull() ?: 3000
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

    return AppConfig(
        mongoUri = mongoUri,
        mongoDatabase = mongoDbName,
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
