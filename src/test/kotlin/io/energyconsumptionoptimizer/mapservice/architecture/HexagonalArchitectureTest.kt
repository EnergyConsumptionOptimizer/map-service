package io.energyconsumptionoptimizer.mapservice.architecture

import com.tngtech.archunit.core.domain.JavaClasses
import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes
import io.energyconsumptionoptimizer.mapservice.application.inbound.InBoundPort
import io.energyconsumptionoptimizer.mapservice.application.outbound.OutBoundPort
import io.energyconsumptionoptimizer.mapservice.infrastructure.Adapter
import io.kotest.core.spec.style.ShouldSpec

class HexagonalArchitectureTest :
    ShouldSpec({

        val importedClasses: JavaClasses =
            ClassFileImporter().importPackages("io.energyconsumptionoptimizer")

        val domainPackage = "..domain.."
        val applicationPackage = "..application.."
        val infrastructurePackage = "..infrastructure.."

        context("Hexagonal Architecture") {

            should("ports should reside in application or domain") {

                val portsRule =
                    classes()
                        .that()
                        .areAnnotatedWith(InBoundPort::class.java)
                        .or()
                        .areAnnotatedWith(OutBoundPort::class.java)
                        .should()
                        .resideInAPackage(applicationPackage)
                        .orShould()
                        .resideInAPackage(domainPackage)

                portsRule.check(importedClasses)
            }

            should("adapters should reside in infrastructure") {
                val adaptersRule =
                    classes()
                        .that()
                        .areAnnotatedWith(Adapter::class.java)
                        .should()
                        .resideInAPackage(infrastructurePackage)

                adaptersRule.check(importedClasses)
            }
        }
    })
