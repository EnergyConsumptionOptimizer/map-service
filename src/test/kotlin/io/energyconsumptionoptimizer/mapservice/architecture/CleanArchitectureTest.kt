package io.energyconsumptionoptimizer.mapservice.architecture

import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses
import io.kotest.core.spec.style.ShouldSpec

class CleanArchitectureTest :
    ShouldSpec({

        val importedClasses =
            ClassFileImporter().importPackages("io.energyconsumptionoptimizer")

        context("The domain should not depend on outer layers") {

            should("Domain should not depend on application") {
                val rule =
                    noClasses()
                        .that()
                        .resideInAPackage("..domain..")
                        .should()
                        .dependOnClassesThat()
                        .resideInAPackage("..application..")

                rule.check(importedClasses)
            }

            should("Domain should not depend on infrastructure") {
                val rule =
                    noClasses()
                        .that()
                        .resideInAPackage("..domain..")
                        .should()
                        .dependOnClassesThat()
                        .resideInAPackage("..infrastructure..")

                rule.check(importedClasses)
            }

            should("Domain should not depend on presentation") {
                val rule =
                    noClasses()
                        .that()
                        .resideInAPackage("..domain..")
                        .should()
                        .dependOnClassesThat()
                        .resideInAPackage("..presentation..")

                rule.check(importedClasses)
            }
        }

        context("The application should not depend on outer layers") {

            should("Application should not depend on infrastructure") {
                val rule =
                    noClasses()
                        .that()
                        .resideInAPackage("..application..")
                        .should()
                        .dependOnClassesThat()
                        .resideInAPackage("..infrastructure..")

                rule.check(importedClasses)
            }

            should("Application should not depend on presentation") {
                val rule =
                    noClasses()
                        .that()
                        .resideInAPackage("..application..")
                        .should()
                        .dependOnClassesThat()
                        .resideInAPackage("..presentation..")

                rule.check(importedClasses)
            }
        }

        context("The infrastructure should not depend on outer layers") {

            should("Infrastructure should not depend on presentation") {
                val rule =
                    noClasses()
                        .that()
                        .resideInAPackage("..infrastructure..")
                        .should()
                        .dependOnClassesThat()
                        .resideInAPackage("..presentation..")

                rule.check(importedClasses)
            }
        }
    })
