package io.energyconsumptionoptimizer.mapservice.domain

import io.energyconsumptionoptimizer.mapservice.domain.utils.isPointInPolygon
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe

class IsPointInPolygonTest :
    ShouldSpec(
        {
            context("isPointInPolygon") {
                should("return true for point inside square") {
                    val point = Point(5.0, 5.0)
                    val square =
                        listOf(
                            Point(0.0, 0.0),
                            Point(10.0, 0.0),
                            Point(10.0, 10.0),
                            Point(0.0, 10.0),
                        )

                    val result = isPointInPolygon(point, square)

                    result shouldBe true
                }

                should("return false for point outside square") {

                    val point = Point(15.0, 15.0)
                    val square =
                        listOf(
                            Point(0.0, 0.0),
                            Point(10.0, 0.0),
                            Point(10.0, 10.0),
                            Point(0.0, 10.0),
                        )

                    val result = isPointInPolygon(point, square)

                    result shouldBe false
                }
            }
        },
    )
