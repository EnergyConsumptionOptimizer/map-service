package io.energyconsumptionoptimizer.mapservice.domain.errors

abstract class DomainException(
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)

class FlorPlanFormatNotValidException : DomainException("The provided SVG is not valid")

class FlorPlanFormatNotFoundException : DomainException("Floor plan does not exist")

class ZoneIDNotFoundException(
    id: String,
) : DomainException("Zone ID $id not found")

class ZoneNameAlreadyExistsException(
    name: String,
) : DomainException("Zone with name '$name' already exists")

class SmartFurnitureHookupIDNotFoundException(
    id: String,
) : DomainException("Smart furniture hookup ID $id not found")

class SmartFurnitureHookupAlreadyExistsException(
    id: String,
) : DomainException("Smart furniture hookup with ID $id already exists")
