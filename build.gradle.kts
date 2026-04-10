import io.github.andreabrighi.gradle.gitsemver.conventionalcommit.ConventionalCommit
import io.gitlab.arturbosch.detekt.Detekt

plugins {
    alias(libs.plugins.gitSemVer)
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.dokka)
    alias(libs.plugins.kotlin.qa)
    alias(libs.plugins.kotlin.serialization)
    application
    alias(libs.plugins.jib)
}

repositories {
    mavenCentral()
}

application {
    mainClass.set("io.energyconsumptionoptimizer.mapservice.ServerKt")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

buildscript {
    dependencies {
        classpath("io.github.andreabrighi:conventional-commit-strategy-for-git-sensitive-semantic-versioning-gradle-plugin:1.0.15")
    }
}

dependencies {
    testImplementation(libs.bundles.kotlin.testing)
    implementation(libs.bundles.ktor)
    implementation(libs.logback.classic)
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kmongo.coroutine.serialization)
    implementation(libs.dotenv.kotlin)
}

gitSemVer {
    commitNameBasedUpdateStrategy(ConventionalCommit::semanticVersionUpdate)
    minimumVersion.set("0.1.0")
}

dokka {
    dokkaPublications.html {
        outputDirectory.set(layout.buildDirectory.dir("$rootDir/docs"))
    }
}

// Fat Jar
tasks.jar {
    archiveFileName.set("app.jar")
    manifest {
        attributes["Main-Class"] = application.mainClass.get()
    }
    from(
        configurations.runtimeClasspath
            .get()
            .map { if (it.isDirectory) it else zipTree(it) },
    )
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

jib {
    from {
        image = "eclipse-temurin:21-jre-jammy"
        if (System.getenv("CI") == "true") {
            platforms {
                platform { architecture = "amd64"; os = "linux" }
                platform { architecture = "arm64"; os = "linux" }
            }
        }
    }
    to {
        image = "ghcr.io/energyconsumptionoptimizer/${project.name}"
        if (System.getenv("CI") == "true") {
            tags = setOf("latest")
        }
    }
    container {
        mainClass = application.mainClass.get()
        ports = listOf("3000")
        user = "root" 
        environment = mapOf("KTOR_DEVELOPMENT" to "true")
    }
}

tasks.withType<Detekt>().configureEach {
    config.setFrom(files("$rootDir/detekt.yml"))
    buildUponDefaultConfig = true
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}

tasks.register("lint") {
    group = "quality"
    dependsOn("detekt")
}

tasks.register("checkFormat") {
    group = "quality"
    dependsOn("ktlintCheck")
}

tasks.named("build") {
    dependsOn("ktlintFormat", "detekt", "test")
}
