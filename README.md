# Map Service
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![Version](https://img.shields.io/github/v/release/EnergyConsumptionOptimizer/map-service)

The Map Service is responsible for managing the floor plan, the zones and the placement of smart furniture hookups.

## Technologies Used
[![Ktor](https://img.shields.io/badge/Ktor-087CFA?style=for-the-badge&logo=ktor&logoColor=white)](https://ktor.io/)
### Database
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
### Infrastructure
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
### DevOps
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)](https://gradle.org/)
[![Docker Hub](https://img.shields.io/badge/Docker_Hub-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/)
[![Semantic Release](https://img.shields.io/badge/Semantic_Release-494949?style=for-the-badge&logo=semantic-release&logoColor=white)](https://semantic-release.gitbook.io/)
[![Semantic Versioning](https://img.shields.io/badge/Semantic_Versioning-333333?style=for-the-badge&logo=semver&logoColor=white)](https://semver.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional_Commits-FE5196?style=for-the-badge&logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org/en/v1.0.0/)
[![Renovate](https://img.shields.io/badge/Renovate-1A1F6C?style=for-the-badge&logo=renovate&logoColor=white)](https://renovatebot.com/)

## REST API Endpoints

### House Map
- `GET /api/house-map`

### Floor Plan
- `GET /api/floor-plan`
- `POST /api/floor-plan`

### Zones
- `GET /api/zones`
- `POST /api/zones`
- `GET /api/zones/{id}`
- `PATCH /api/zones/{id}`
- `DELETE /api/zones/{id}`

### Smart Furniture Hookups
- `GET /api/smart-furniture-hookups`
- `POST /api/smart-furniture-hookups`
- `GET /api/smart-furniture-hookups/{id}`
- `PATCH /api/smart-furniture-hookups/{id}`
- `DELETE /api/smart-furniture-hookups/{id}`

### Internal
- `GET /api/internal/smart-furniture-hookups/{id}`

## Documentation
Documentation of the kotlin code base can be found at the [Dokka](https://energyconsumptionoptimizer.github.io/map-service/).

## Authors
- Rares Vasiliu ([rares-vsl](https://github.com/rares-vsl))