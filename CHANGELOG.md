# Changelog

## [2.1.0](https://github.com/ReillySteere/DeveloperProfile/compare/v2.0.0...v2.1.0) (2026-02-07)


### Features

* add Performance Observatory with real-time Web Vitals monitoring ([#74](https://github.com/ReillySteere/DeveloperProfile/issues/74)) ([ddaaa0f](https://github.com/ReillySteere/DeveloperProfile/commit/ddaaa0fcac738d061dce65e6b94d25e76f1a18c1))

## [2.0.0](https://github.com/ReillySteere/DeveloperProfile/compare/v1.5.0...v2.0.0) (2026-02-07)


### ⚠ BREAKING CHANGES

* Swagger documentation now requires JWT authentication

### Features

* add interactive case study system ([#72](https://github.com/ReillySteere/DeveloperProfile/issues/72)) ([25b7655](https://github.com/ReillySteere/DeveloperProfile/commit/25b76558f0eafa6e6863cb4c54d4e64ee9c4641c))
* Rate Limiting and Alerting (Phase 2 Observability) ([#52](https://github.com/ReillySteere/DeveloperProfile/issues/52)) ([c72fc71](https://github.com/ReillySteere/DeveloperProfile/commit/c72fc71523603e921f6b7707d2e3dd13e34cb0b3))


### Bug Fixes

* add API root endpoint to resolve 404 on /api ([#60](https://github.com/ReillySteere/DeveloperProfile/issues/60)) ([c9efed2](https://github.com/ReillySteere/DeveloperProfile/commit/c9efed2611e1057731da2937912291cf845a0933))
* add missing AlertHistory columns and MSW testing infrastructure ([#56](https://github.com/ReillySteere/DeveloperProfile/issues/56)) ([056ddf8](https://github.com/ReillySteere/DeveloperProfile/commit/056ddf85697d7090218bbf1d23ee81e6c6dcef08))
* add missing database migrations for rate_limit_entries and alert_history ([#55](https://github.com/ReillySteere/DeveloperProfile/issues/55)) ([388e7aa](https://github.com/ReillySteere/DeveloperProfile/commit/388e7aa1a5e257112f4d0a544b44ab5caa1280b1))
* **architecture:** improve link navigation and handle unavailable content ([#69](https://github.com/ReillySteere/DeveloperProfile/issues/69)) ([37eb654](https://github.com/ReillySteere/DeveloperProfile/commit/37eb6547587a17332b9cb3e8449eadeeb5996a67))
* enable markdown table rendering with remark-gfm plugin ([#67](https://github.com/ReillySteere/DeveloperProfile/issues/67)) ([b7119a2](https://github.com/ReillySteere/DeveloperProfile/commit/b7119a2b50a711e39f9ad50a399eee07d4e8ec47))
* protect Swagger documentation with JWT authentication ([#61](https://github.com/ReillySteere/DeveloperProfile/issues/61)) ([3d3194b](https://github.com/ReillySteere/DeveloperProfile/commit/3d3194be8265ff37c3fcd9aaff357424e5be34e5))
* remove duplicate title and status in ADR detail view ([#68](https://github.com/ReillySteere/DeveloperProfile/issues/68)) ([01992a7](https://github.com/ReillySteere/DeveloperProfile/commit/01992a7730c7df2a4a45385542e2c96baf3e55d6))
* remove Swagger UI authentication blocking ([#62](https://github.com/ReillySteere/DeveloperProfile/issues/62)) ([dbcbdc1](https://github.com/ReillySteere/DeveloperProfile/commit/dbcbdc132bdeb7a26f08023fa8c508dd862ecbab))
* suppress no-orphans warnings for migration files ([#65](https://github.com/ReillySteere/DeveloperProfile/issues/65)) ([7ea10be](https://github.com/ReillySteere/DeveloperProfile/commit/7ea10be9192d5a6e8479d7706f3f5b76a55545f6))
* **ui:** correct theme token usage in status page components ([#66](https://github.com/ReillySteere/DeveloperProfile/issues/66)) ([511c882](https://github.com/ReillySteere/DeveloperProfile/commit/511c882523041651f3a911d2b65ef6b8e7a5f055))
* use correct design tokens in DependencyGraph styles ([#70](https://github.com/ReillySteere/DeveloperProfile/issues/70)) ([0825fc7](https://github.com/ReillySteere/DeveloperProfile/commit/0825fc75fed7d9bcb7b8eb395fa8af04fa839e3e))


### Code Refactoring

* achieve 100% test coverage across UI and server ([#64](https://github.com/ReillySteere/DeveloperProfile/issues/64)) ([0ad5c0a](https://github.com/ReillySteere/DeveloperProfile/commit/0ad5c0a443ecc6ac8e9e1ad037bd7a5128de127f))
* add trace event constants and update documentation ([#57](https://github.com/ReillySteere/DeveloperProfile/issues/57)) ([1ecd614](https://github.com/ReillySteere/DeveloperProfile/commit/1ecd614008a76124f85a78713b3208659f24accb))


### Documentation

* complete MSW integration and update documentation ([#63](https://github.com/ReillySteere/DeveloperProfile/issues/63)) ([170c09b](https://github.com/ReillySteere/DeveloperProfile/commit/170c09b43def600d89c7a1d29feddc6c5e477af7))

## [1.5.0](https://github.com/ReillySteere/DeveloperProfile/compare/v1.4.0...v1.5.0) (2026-01-25)


### Features

* Add Request Tracing & Observability Dashboard ([#47](https://github.com/ReillySteere/DeveloperProfile/issues/47)) ([f0dd8a7](https://github.com/ReillySteere/DeveloperProfile/commit/f0dd8a7e1afaafe8089bd3c5be632edc503b3454))

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
