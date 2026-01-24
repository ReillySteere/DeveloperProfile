# Changelog

## [1.4.0](https://github.com/ReillySteere/DeveloperProfile/compare/v1.3.1...v1.4.0) (2026-01-24)


### Features

* **database:** add production-safe migrations infrastructure ([#42](https://github.com/ReillySteere/DeveloperProfile/issues/42)) ([80fa8f0](https://github.com/ReillySteere/DeveloperProfile/commit/80fa8f0580c02580a73f2eafbc56a55da19b4fbc))


### Bug Fixes

* correct projects table name mismatch in migrations ([#46](https://github.com/ReillySteere/DeveloperProfile/issues/46)) ([0ec6ac7](https://github.com/ReillySteere/DeveloperProfile/commit/0ec6ac7636b98a3ada97458d1e43cf737ec4a342))
* generate dependency graphs during Docker build ([#40](https://github.com/ReillySteere/DeveloperProfile/issues/40)) ([f13dc03](https://github.com/ReillySteere/DeveloperProfile/commit/f13dc03081d6ee4bbb9e99abac850d972a35bda9))

## [1.3.1](https://github.com/ReillySteere/DeveloperProfile/compare/v1.3.0...v1.3.1) (2026-01-23)


### Bug Fixes

* add defense-in-depth for production path resolution ([#39](https://github.com/ReillySteere/DeveloperProfile/issues/39)) ([4d62cab](https://github.com/ReillySteere/DeveloperProfile/commit/4d62cab576189f349feabb591f3c68b96655b0b6))
* include architecture assets in production build ([#37](https://github.com/ReillySteere/DeveloperProfile/issues/37)) ([efbd4ba](https://github.com/ReillySteere/DeveloperProfile/commit/efbd4bab6fa9f4f8cd93a1e6579287f67196125c))

## [1.3.0](https://github.com/ReillySteere/DeveloperProfile/compare/v1.2.0...v1.3.0) (2026-01-22)


### Features

* add Architecture Explorer feature ([#34](https://github.com/ReillySteere/DeveloperProfile/issues/34)) ([42575dc](https://github.com/ReillySteere/DeveloperProfile/commit/42575dc3552ecf206352930a4e21a03e273ed4d0))

## [1.2.0](https://github.com/ReillySteere/DeveloperProfile/compare/v1.1.0...v1.2.0) (2026-01-19)


### Features

* add Mission Control telemetry dashboard with SSE streaming ([#26](https://github.com/ReillySteere/DeveloperProfile/issues/26)) ([6dc2702](https://github.com/ReillySteere/DeveloperProfile/commit/6dc27021ad208041965b3596efdc8ca789965c68))

## [1.1.0](https://github.com/ReillySteere/DeveloperProfile/compare/v1.0.0...v1.1.0) (2026-01-18)


### Features

* add Playwright E2E tests for critical user workflows ([#21](https://github.com/ReillySteere/DeveloperProfile/issues/21)) ([d679c48](https://github.com/ReillySteere/DeveloperProfile/commit/d679c487f1f4d9103c7e34032a3ac2a5acbf90cd))


### Bug Fixes

* update release workflow and commitlint configuration ([#22](https://github.com/ReillySteere/DeveloperProfile/issues/22)) ([3aa7228](https://github.com/ReillySteere/DeveloperProfile/commit/3aa72287a997b7d2bbb43a4066d48b1a02855d73))


### Code Refactoring

* Implement hexagonal architecture for shared modules (ADR-005) ([#20](https://github.com/ReillySteere/DeveloperProfile/issues/20)) ([f31dbf3](https://github.com/ReillySteere/DeveloperProfile/commit/f31dbf35dd269e501b8907957801b11065b10fe0))

## 1.0.0 (2026-01-18)


### Features

* **about:** implement resume download with full test coverage and documentation ([5ffd2f2](https://github.com/ReillySteere/DeveloperProfile/commit/5ffd2f2cdf01eadc813875350cd5b81dd7c23d7b))
* add Phase 1 foundation improvements ([691ff9c](https://github.com/ReillySteere/DeveloperProfile/commit/691ff9cbfb34ab8acf62f567761231705bb10379))
* Add Phase 1 Foundation Improvements (Environment, Health Check, Security, Dependabot) ([20af45e](https://github.com/ReillySteere/DeveloperProfile/commit/20af45e2005076909798c339acea6af9b5bc0f4d))
* add Phase 3 AI Agent skills (security, state-management, routing, debugging) ([db1beaf](https://github.com/ReillySteere/DeveloperProfile/commit/db1beaf503b44bc50ae242371a10aa81cb2d4614))
* add Playwright E2E tests for critical user workflows ([#21](https://github.com/ReillySteere/DeveloperProfile/issues/21)) ([d679c48](https://github.com/ReillySteere/DeveloperProfile/commit/d679c487f1f4d9103c7e34032a3ac2a5acbf90cd))
* **infra:** Add docker-compose, structured logging, and Sentry configuration ([#19](https://github.com/ReillySteere/DeveloperProfile/issues/19)) ([940c7f2](https://github.com/ReillySteere/DeveloperProfile/commit/940c7f2e2760a7dbfbbb03e0810cf8b9599b22ca))
* Phase 2 & 3 - DX Improvements and AI Agent Skills ([ea2f2b5](https://github.com/ReillySteere/DeveloperProfile/commit/ea2f2b59cc0bbe721bd571455609f9222b86ba0f))
* Phase 2 Developer Experience Improvements ([5a92c51](https://github.com/ReillySteere/DeveloperProfile/commit/5a92c51363bb013c04c56d08c8519c9091bed443))


### Bug Fixes

* remove non-existent labels from dependabot.yml ([bdd73d8](https://github.com/ReillySteere/DeveloperProfile/commit/bdd73d860d38ea5a598499ca5a433fa369fe8de3))
* update release workflow and commitlint configuration ([#22](https://github.com/ReillySteere/DeveloperProfile/issues/22)) ([3aa7228](https://github.com/ReillySteere/DeveloperProfile/commit/3aa72287a997b7d2bbb43a4066d48b1a02855d73))


### Code Refactoring

* Implement hexagonal architecture for shared modules (ADR-005) ([#20](https://github.com/ReillySteere/DeveloperProfile/issues/20)) ([f31dbf3](https://github.com/ReillySteere/DeveloperProfile/commit/f31dbf35dd269e501b8907957801b11065b10fe0))


### Documentation

* Add AI agent documentation - Phases 1-3 ([32bfc5c](https://github.com/ReillySteere/DeveloperProfile/commit/32bfc5cce1dad3c82dde166966ae08100c66eb83))
* Add Phase 4-5 AI agent documentation improvements ([9f61ebd](https://github.com/ReillySteere/DeveloperProfile/commit/9f61ebd006ef6edaf73c39bd2a9300897d383997))
* Add Phase 4-5 AI agent documentation improvements ([329efe6](https://github.com/ReillySteere/DeveloperProfile/commit/329efe6262e7032dbffb338b4a918a44c069f066))
* fix documentation audit issues (route files, stores folder) ([d67dcb6](https://github.com/ReillySteere/DeveloperProfile/commit/d67dcb637b5fc620491696f8130dc001838bfd88))
