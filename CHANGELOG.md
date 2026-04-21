# Changelog

## [1.17.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.16.0...v1.17.0) (2026-04-21)


### Features

* enforce character length restrictions for first and last names in user profile updates ([#1403](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1403)) ([fac0d77](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/fac0d77d08365568eceac9c8c4cbf68f6cf61f44))
* handle duplicate phone number during MFA enrollment and add localized error messages ([73658ff](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/73658ffbcd58839bfc9d66a7c6c4c91537b53c4b))


### Bug Fixes

* handle duplicate phone number during MFA enrollment and add localized error messages ([#1410](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1410)) ([73658ff](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/73658ffbcd58839bfc9d66a7c6c4c91537b53c4b))


### Miscellaneous Chores

* update staging deployed version to 1.16.0 ([#1406](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1406)) ([497a284](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/497a2848a9878950c1d1c63f83a9cea7f49734b5))

## [1.16.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.15.0...v1.16.0) (2026-04-20)


### Features

* add localized relying party info support in schemas and services ([#1393](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1393)) ([6f45f6c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6f45f6c8fe0dbb74e87c1d99b4c4fb7256564e59))

## [1.15.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.14.2...v1.15.0) (2026-04-14)


### Features

* implement FIDO2 Metadata Service with periodic updates and Redis caching ([3e4fc0f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3e4fc0fc513f6e7cb705fcd69b12731bb7e3de18))
* implement mds look up service ([#1345](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1345)) ([4e6ee41](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/4e6ee41cb78670fe7ae36d76e457d52a4a1aad8b))
* Manage app localization design overhaul ([#1373](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1373)) ([c1d47a3](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c1d47a30f1176f0825135016b6b90d3274894e65))


### Bug Fixes

* build issues and fix prod/staging version ([#1375](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1375)) ([865bc51](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/865bc511c462f5ac5a6e0502a5339e4cbf25defe))
* enrolling voice otp after sms throws error ([#1364](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1364)) ([dc8e6a2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/dc8e6a25c3783e1dddc9704ed623a3477357141d))
* **frontend:** all otp/password fields to be same size ([#1389](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1389)) ([019f546](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/019f54609f0fb1949b6cf5c0aebd823d20a0585e))
* **frontend:** remove RPNameDisplay component and update ServicesWithAccessInfo localization strings ([#1377](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1377)) ([e236aaf](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e236aafdbf157fc9841622276c35f96a0b756764))
* **frontend:** skip axio 1.14.1 malicious version ([#1360](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1360)) ([047a857](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/047a857e14912f6af47e79cd657f503482e82d1c))
* **frontend:** upgrade axios &gt;=1.15.0 ([#1381](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1381)) ([10ff23a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/10ff23add041c65635d7594f3b98eef3b629bad2))
* localize email notifications by user language preference in FIDO2 and OTP services ([#1362](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1362)) ([dc7972b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/dc7972b4e81ba1e681e33623241739c5d7919264))
* remove RPNameDisplay component and update ServicesWithAccessInfo localization strings ([e236aaf](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e236aafdbf157fc9841622276c35f96a0b756764))


### Code Refactoring

* add passkey flow default passkey nickname to passkey ([#1368](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1368)) ([78b3466](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/78b3466532efcb57cbd97614f399cd184c9f8637))
* EditLanguagePreferencePage refactor and improvements ([#1354](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1354)) ([3e4fc0f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3e4fc0fc513f6e7cb705fcd69b12731bb7e3de18))
* guard delete fido2 endpoint with otp verification and OTP verification refactors ([#1350](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1350)) ([90ccddf](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/90ccddff55ccbbc8a0b4fc76f32ed3e0b2b7bf51))
* replace scattered try/except blocks with unified error handler ([#1325](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1325)) ([34e3a8f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/34e3a8f63a0d342c46e669d75dff1e0ef30ba636))
* rp name lists to be generic ([#1371](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1371)) ([6b95b8d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6b95b8db379e43fe9ed4de5219631cc7f9c6fdac))
* simplify language preference page by removing unused parameters and effects ([3e4fc0f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3e4fc0fc513f6e7cb705fcd69b12731bb7e3de18))
* update import paths for mds_service in router and main files ([3e4fc0f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3e4fc0fc513f6e7cb705fcd69b12731bb7e3de18))


### Miscellaneous Chores

* **deps:** update dependency requests to v2.33.0 [security] ([#1346](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1346)) ([b41e8ee](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b41e8ee122fd003363ce32fcef811890a8104a20))


### Continuous Integration

* update frontend lint pipeline to include TypeScript type checks and adjust ESLint unused vars pattern ([#1340](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1340)) ([c046431](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c046431cdc20fbdab56534eb5bac70acb87c8e15))
* update staging and prod deployed version: 1.14.2 ([#1342](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1342)) ([e3bfa47](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e3bfa47dc8e05abd94f8d54add08b5f3e480f319))

## [1.14.2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.14.1...v1.14.2) (2026-03-24)


### Bug Fixes

* add user access token to OTP verification and deletion processes ([#1333](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1333)) ([79bfd5e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/79bfd5e679e88049827c54d424872cae5a6123b1))
* remove unused GcdsIcon import from ConfirmUpdate component ([#1338](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1338)) ([96a2f0b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/96a2f0be80b9f771935d222eeeb6a65104842bff))


### Continuous Integration

* update staging and prod deployed versions ([#1334](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1334)) ([a029f1a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a029f1a4678ad85c6bdbb8ffb83c9b5bea4719d7))

## [1.14.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.14.0...v1.14.1) (2026-03-24)


### Bug Fixes

* **frontend:** Change CanadaLogin website links to be production URLs ([#1323](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1323)) ([7846da4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7846da4042bdb9223c8b6cba79591f46fb2a449a))
* **frontend:** update cdssncgcds/components library to gcds/corecomponents library ([#1319](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1319)) ([33f16c7](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/33f16c7f0244f1ac90e0f0d7feae9b84d1618d6e))
* OTP Verification screen does not display masked phone number ([#1316](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1316)) ([9bfda5f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9bfda5f794d1e464d1c8bd20d99fa4254735590e))
* preserve mid-word capitalization in user profile names ([#1321](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1321)) ([9de647e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9de647e8f681928f262ba2b348e5dd0159b0ed66))
* support deletion of unvalidated factors without OTP verification ([#1312](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1312)) ([80c5b52](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/80c5b52f2d39367de357b2cd12846034427cf34f))
* trim whitespace and collapse internal spaces in user profile names ([#1322](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1322)) ([9b4ec17](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9b4ec172fb3013fcbf8837f1baedc4352e2a1ac9))


### Code Refactoring

* refactor api endpoints to use user access token where applicable ([#1314](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1314)) ([75062ac](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/75062acba18e1bfc1ca864a14d57350e718c870e))


### Miscellaneous Chores

* **ci:** update prod version to v1.11.1 to match staging and pick up new domain vars ([#1328](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1328)) ([c7f46b0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c7f46b0ade14ef541b83ff808e143319dc6453bc))
* **ci:** Update version to 1.11.1 in prod to pick up new domain vars ([c7f46b0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c7f46b0ade14ef541b83ff808e143319dc6453bc))

## [1.14.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.13.0...v1.14.0) (2026-03-16)


### Features

* **front:** 1267 migrate utils folder from js to ts ([#1268](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1268)) ([314fe8a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/314fe8aa820da1ffaf4c50dc17a4e7e8b0910816))
* **frontend:** 1274 migrate frontendsrcfeatureschangepassword ([#1292](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1292)) ([7d83073](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7d83073e7f5794bc2c672840d2bab93280fb7150))
* **frontend:** contact phone number JS to TS ([#1293](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1293)) ([685bd34](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/685bd3428838d1b9fdf61b55721d34c1adfa21dd))
* **frontend:** figma revisions passthrough ([#1304](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1304)) ([22c2a06](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/22c2a06200a3a837f6b0ee7626bef1339bdfc501))
* **frontend:** Implement Add passkey flow according to Figma ([#1263](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1263)) ([60b8592](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/60b85925e401889a1ca2d8643a982cfb1e3a60f0))
* **frontend:** implement delete passkey flow according to figma ([#1249](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1249)) ([2b4f56a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2b4f56ac40586c19de4a713d5a352d912910031d))
* **frontend:** implement rename passkey flow according to figma ([#1261](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1261)) ([96aa77e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/96aa77e5206924675b7b9aa00e9b59cdf68ac5eb))
* **frontend:** migrate email address management components from JS to TS ([#1291](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1291)) ([eff8a84](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/eff8a8429d80ca278cc1dc58e3cc5e86850caf53))
* **frontend:** Migrate ManageFIDO2 from JS to TS ([#1297](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1297)) ([2349ff6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2349ff61e4f1c2ced5b0713a47c7dd4284f3930f))
* **frontend:** Migrate MFAPhoneNumber to TS ([#1294](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1294)) ([ad9a92e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ad9a92ef214ecb37781f2ca85b064d87c1909978))
* **frontend:** migrate Transient OTP components and related files from JS to TS ([#1288](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1288)) ([d15b5a6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d15b5a61359a0100b83472c72134b006669ba9c2))
* **frontend:** profilename JS to TS ([#1296](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1296)) ([de338d5](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/de338d519f046b01eab0da9b03dc498be303ea35))
* Implement Delete FIDO2 Passkey functionality ([2349ff6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2349ff61e4f1c2ced5b0713a47c7dd4284f3930f))
* **middleware:** add error logging middleware following internal standard ([#1239](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1239)) ([78d0ab2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/78d0ab229d8c3596bcfacf53576cf8b57fd318dd))


### Bug Fixes

* **frontend:** 1271 migrate components folder from js to ts ([#1272](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1272)) ([a525051](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a52505104ab7bc0c0659596eb1b3a4344c7e6be1))
* **frontend:** hooks and services js to ts ([#1270](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1270)) ([3834186](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3834186526b96212f589d624cf4928009bdce4b1))
* **frontend:** Profile preferred name change ([#1257](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1257)) ([2cdbdb0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2cdbdb01d6ea0c15bdcbaf9ed8a6664c72f80b1a))
* **frontend:** tighten TS linting strict mode ([#1286](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1286)) ([07ac2f1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/07ac2f12aec88f55b8b65f888914f71868e64f88))
* **frontend:** Update external link for GC Account Directory in edit language flow ([#1266](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1266)) ([ff1ccfa](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ff1ccfaddb8c4e3d6e040168157d75ab8cb66d0c))
* **frontend:** Update footer links to be correct ([#1260](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1260)) ([b57cf02](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b57cf02007e9c50453da37f42c281c4a15702633))
* **frontend:** update name fields to auto-populate from user profile ([#1254](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1254)) ([68540c6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/68540c6bc10855114bbdb9ccedf38ad768843444))
* **frontend:** update redirect link for 2FA verifications page in phone number update flow ([#1253](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1253)) ([87a5cd1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/87a5cd1a1af092e09d6b8ad9ba18c2cfdf138a43))
* **frontend:** update return type of getUserOtpPhoneFactors to include success status ([#1290](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1290)) ([b24e40c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b24e40c599f504d07b6b17a75a759ea096e1e1be))


### Miscellaneous Chores

* **deps:** update dependency storybook to v8.6.17 [security] ([#1233](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1233)) ([e45d15c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e45d15c5f8873ba01a09a2a41b2d5eac9035e358))
* Update CDS security tools version to v4.0.2 ([#1255](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1255)) ([148c78e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/148c78e967cc4f77abc63e93bbcef096b1317f2d))

## [1.13.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.12.1...v1.13.0) (2026-03-03)


### Features

* **frontend:** implement list passkeys according to figma ([#1226](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1226)) ([b6cd718](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b6cd718cb7556ce0b7bbb22ba76ece32da3a224a))


### Bug Fixes

* **frontend:** Re-brand Manage app to CanadaLogin and update documentation ([#1183](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1183)) ([57b442b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/57b442bbb1833c0603af0b9de325a0656fd87c47))
* **frontend:** Re-brand Manage app to CanadaLogin and update documentation ([#1244](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1244)) ([4c0d215](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/4c0d2156aa6ed1335f534a2ff48b09f6da68e494))


### Miscellaneous Chores

* **ci:** update generate-sbom version ([#1246](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1246)) ([f6efe43](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/f6efe43cc5ae9b9ce05be22eb1b643aa3e166113))

## [1.12.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.12.0...v1.12.1) (2026-02-26)


### Bug Fixes

* fix security settings loading screen in test env ([#1235](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1235)) ([dba2b93](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/dba2b93b576d9442412fd3f535bf1e92e8b1500e))

## [1.12.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.11.1...v1.12.0) (2026-02-26)


### Features

* **backend:** Implement FIDO2 access token step up ([#1180](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1180)) ([c87137e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c87137e20c370951e3adf1f1eb8a4558af12b6b1))


### Bug Fixes

* adjust feature flags to disable in-progress features in test env… ([#1228](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1228)) ([f0b1329](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/f0b1329c80bd720fef190e369250e5c6cf6b595f))
* **ci:** add release-please dependency to detect-release-tag ([#1213](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1213)) ([2398575](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/23985750d4bc6de05c50b098427f2ce262003bfb)), closes [#1132](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1132)
* correct phone factors mapping ([#1225](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1225)) ([e54667f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e54667fd9d985f2bc1de9bfd1b358ba461c5a25e))


### Continuous Integration

* bump staging version to 1.11.1 ([#1216](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1216)) ([8921ffc](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8921ffcbee5e95c5687c85f736e8d30c73a2f453))
* update invalidation for cloudfront to include the assets folder ([#1212](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1212)) ([7295b92](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7295b92e2367c18c961f1e68650d8776444ead23))

## [1.11.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.11.0...v1.11.1) (2026-02-23)


### Continuous Integration

* bump TEST environment deployed version ([#1206](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1206)) ([80044c6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/80044c62a04a596e2542a9a00273ecf910001d4c))
* deploy to TEST environment on release ([#1204](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1204)) ([daef445](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/daef4454ac339a43d341ae6f159fa2365df2a6d3))

## [1.11.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.10.3...v1.11.0) (2026-02-20)


### Features

* Add log filter to remove healthcheck spam from our ECS logs ([#1178](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1178)) ([3b3f484](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3b3f484d27ed88c6ad60c67c1da20b5a36f4dd29))
* **frontend:** add tsconig file ([#1191](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1191)) ([92de3d0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/92de3d0b5168205cae6ea90f9f4f051158b18ae5))
* **frontend:** IDV Landing page on the security settings page ([#1165](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1165)) ([64f8bc6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/64f8bc68604b85e46424d7d7df80d8a69c38f2ba))
* **frontend:** implement add fido2 passkey pages and re verification logic ([#1137](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1137)) ([c16b11e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c16b11e2771eee972435b30d8d1f3102a6e6550d))
* **frontend:** Implement rename passkey flow ([#1158](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1158)) ([bc2e2d6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/bc2e2d6efe468e7092c4a5a52775c46ea78c7637))
* **frontend:** Implement rename passkey flow and associated UI components ([bc2e2d6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/bc2e2d6efe468e7092c4a5a52775c46ea78c7637))
* **frontend:** update navigation for deleting FIDO2 passkeys with state ([66e986b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/66e986b83106feab03647504fb90dfca5d655148))
* IDV Landing page on the security settings page ([64f8bc6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/64f8bc68604b85e46424d7d7df80d8a69c38f2ba))
* Implement user profile name validation to reject numbers and special symbols ([#1189](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1189)) ([a3716b0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a3716b04ba65b634736f5d4bca5ec9e571749008))


### Bug Fixes

* Add vite.config.js, cert.pem and key.pem to .gitignore for HTTPS for local development using mkcert ([#1141](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1141)) ([e386d3e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e386d3ef02bad003442d6a1a5fb634671572d9b9))
* **frontend:** fix add passkey flow bug sending multiple mfa otps ([#1144](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1144)) ([0931e21](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/0931e21e14eed2861daf0fb5dc96af0a073e17f4))
* **frontend:** Handle TypeError for non-serializable credentials in formatAttestationForServer ([#1168](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1168)) ([d0c5c94](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d0c5c944a5e2671ff9bb2c009201b1a00f04822a))
* **frontend:** Prevent redirection to Security Settings page on 4xx fetches ([#1153](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1153)) ([b60e9d4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b60e9d452f75653d89c51fa4cce7bda53ab9c2c9))
* **frontend:** Prevent redirection to Security Settings page when no passkeys are present ([b60e9d4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b60e9d452f75653d89c51fa4cce7bda53ab9c2c9))
* **frontend:** Retrieve and display list of FIDO2 passkeys on Security Settings page ([#1142](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1142)) ([398b965](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/398b96539ec4da66802ecd29e4af2521b8fae3ef))


### Code Refactoring

* **backend:** refactor FIDO2 services and unit tests ([#1139](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1139)) ([db2cf34](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/db2cf345880039d389c95bdef20ea0f9f102d1d1))
* **backend:** update FIDO2 registration schema and response handling to align with IBM Verify schema ([#1166](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1166)) ([230e568](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/230e56813b747fc38067a2e49544c782aee165e0))
* **frontend:** clean up DeleteFIDO2Passkey components and remove unused code ([66e986b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/66e986b83106feab03647504fb90dfca5d655148))


### Continuous Integration

* update version for the Test environment ([5fbe62c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5fbe62c18eb1b15b1ddc069ad0cefdec547ab423))
* update version for the Test environment - 1.10.3 ([#1121](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1121)) ([5fbe62c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5fbe62c18eb1b15b1ddc069ad0cefdec547ab423))


### Documentation

* add bruno collection ([#1136](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1136)) ([a581bd0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a581bd03930839297d9478863f2bea69068e0c02))
* add HTTPS setup guide for local development with mkcert ([#1124](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1124)) ([8e2fa28](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8e2fa28264ad73092705cc669feb7517486de0d0))
* update HTTPS setup for local development to use subdomain of vanity domain ([#1125](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1125)) ([71a9439](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/71a9439b9efcd42742978a8638ee30a8263f6d80))

## [1.10.3](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.10.2...v1.10.3) (2026-01-12)


### Bug Fixes

* **deps:** update all minor dependencies ([#1003](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1003)) ([9b1d8ee](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9b1d8ee2897836b19d44ae40b47a26b32da9c4e6))
* **frontend:** Add stories for features ([#1097](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1097)) ([6178737](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/61787374aacc457b61ac7a3d18d3ac01c8eba244))
* **frontend:** make logout post call ([#1089](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1089)) ([edfc4db](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/edfc4db76ee0ceae3db0891ce0d3c101d84681e9))
* **frontend:** Number Selection Screen Appears When Adding a Phone Number in 2-Step Verification ([#1111](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1111)) ([e6ac066](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e6ac0663047623202c9f64781f7bcbaad4faeeb0))


### Code Refactoring

* **backend:** created a utility function to mask profile details ([#1102](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1102)) ([bc1344a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/bc1344a22ad29c13a0dfdbdd2c6fd7346d24e70d))
* **backend:** retrieve unmasked profile for the update profile ([#1108](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1108)) ([b04a20c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b04a20c694b3992951ea44da3325c8590113c4ce))
* **backend:** Update instances of status.HTTP_422_UNPROCESSABLE_ENTITY to the more correct status.HTTP_422_UNPROCESSABLE_CONTENT ([#1106](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1106)) ([8c1b078](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8c1b0787b952df1f7890223a4f0bf349c1f036e0))
* **backend:** Update the http status to use the fastapi status value ([8c1b078](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8c1b0787b952df1f7890223a4f0bf349c1f036e0))
* **backend:** utility constant to store hardcoded values ([#1110](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1110)) ([5ddff95](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5ddff95cdbd92d710967ee9d9752358ddb6e3d44))
* **ci/cd:** Pull release tag extraction into its own job in the release pipeline ([#1099](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1099)) ([0e42977](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/0e42977d11a9347153fc6731963ddfa6df861487))
* **frontend:** Edit Contact Phone Number verifies OTP in single transaction ([#1117](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1117)) ([2eb6dc7](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2eb6dc70d2a8ee1bccefece562ebc6a504bfbf50))


### Miscellaneous Chores

* **deps:** lock file maintenance ([#1044](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1044)) ([81e88e7](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/81e88e7983193a9920d56e0929507fa1dd6a4d17))
* **deps:** update all non-major github action dependencies ([#1004](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1004)) ([7a5d9fe](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7a5d9fe589b5a157408e68ba6fcb8e3e0906533e))
* **deps:** update all patch dependencies ([#1043](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1043)) ([9939d11](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9939d118bd16382eeb6115673b3bcd70244a288e))
* **deps:** update dependency vite to v6.4.1 [security] ([#1033](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1033)) ([736631b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/736631b7c30005e0d313876679257fe5164a9b35))


### Continuous Integration

* display application version in footer ([#1100](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1100)) ([3ce3447](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3ce344774ce313b8caa06bb1ff1d5b510746ba4d))
* release 1.10.2 ([#1083](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1083)) ([db59492](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/db594920da079a4c5ef371e63ec83aa2889eb127))

## [1.10.2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.10.1...v1.10.2) (2025-12-22)


### Bug Fixes

* Revert change to disable the logout functionality ([#1080](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1080)) ([0047d8f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/0047d8f070bb6a1d9b8c1965875f5e42e1bffced))


### Continuous Integration

* updated the release versions for all environments to 1.10.1 ([#1077](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1077)) ([a325c76](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a325c76d96e7d6e4fe8b27b22f9ef697a12124d5))

## [1.10.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.10.0...v1.10.1) (2025-12-22)


### Bug Fixes

* Disabled Logout Functionality ([#1074](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1074)) ([e1418cf](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e1418cfb48b74511eae275fba11ef86ab7554ad1))

## [1.10.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.9.1...v1.10.0) (2025-12-19)


### Features

* feature flag to conditionally display edit email link based on environment ([#1071](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1071)) ([190742e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/190742edb3e853071970408bd5eab731fe266de6))
* Link OTP verification with profile change ([#1070](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1070)) ([16255f9](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/16255f9466bf9d0566be945248eda02b5cf4e68a))
* manage profile edit email address ([#1059](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1059)) ([71610cf](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/71610cfbb72ecaf4ec722acccf2c665634fb6908))


### Bug Fixes

* **backend:** Reverted changed made during debugging process ([#1066](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1066)) ([00e4d59](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/00e4d592ff7767b3078004afe80caedd69b5eb28))

## [1.9.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.9.0...v1.9.1) (2025-12-17)


### Bug Fixes

* Use latest tags instead of deployed in release pipeline ([#1049](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1049)) ([46606c6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/46606c6390f814ce047a0ca721a437419ff81abc))

## [1.9.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.8.1...v1.9.0) (2025-12-15)


### Features

* Add release tag to ECR images ([#1040](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1040)) ([75233d7](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/75233d70b528fc8092238c5ffa98b559c510ec10))
* **ci/cd:** Add a deployed tag to the currently deployed ECR image in each AWS environment ([#1037](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1037)) ([6a2b8a9](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6a2b8a9bce4eb6f5b1794bae84395fe78783e4f2))
* Implement Enter key submission handling across multiple components ([#1038](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1038)) ([26518ab](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/26518abb992143e8eb6da18f0235842f106e29f1))
* Update SSM with reference to deployed image ([#1041](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1041)) ([5daa5a0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5daa5a0db2263726ebf4da4a6da8be133e09269d))


### Bug Fixes

* **frontend:** add role attribute to GcdsContainer for improved accessibility ([3541382](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3541382a5e580a04f16ee994a092fccd59a5c6bc))
* **frontend:** GC SignIn Welcome Page : List of accessibility defects ([#1018](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1018)) ([efddd70](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/efddd709b6dffde52dce4024fd1d44b662090e33))
* **frontend:** List of accessibility defects for the Basic Information – Edit Name workflow ([#1016](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1016)) ([c6fe352](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c6fe352c3c9a6349575c4c971d5c543a2a99f005))
* **frontend:** password change confirmation page and password validation ([c6c20d0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c6c20d02ef64f4dbc9405af6332c53558c93bd60))
* **frontend:** Personal Information Page : List of accessibility defects ([#1017](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1017)) ([3541382](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3541382a5e580a04f16ee994a092fccd59a5c6bc))

## [1.8.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.8.0...v1.8.1) (2025-12-11)


### Bug Fixes

* **backend:** add flush logs ([#1023](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1023)) ([b679653](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b679653f9cf095c47d31b94de6eaea2d91fdef86))
* **backend:** reset oidc client code_challenge ([#1020](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1020)) ([8f4859f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8f4859fa806d048226a50c6677dfe9a0acbb8e7c))
* **frontend:** add package-lock into repo ([#1015](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1015)) ([fbe50f2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/fbe50f29291dbf8e28d2ec842c9ca7618969019a))
* **frontend:** add role attribute to GcdsContainer for accessibility ([#1011](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1011)) ([18dde15](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/18dde158e154d2acb12a1895fda765c4572d65ac))
* **frontend:** add role attributes to GcdsContainer and buttons for improved accessibility ([#1012](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1012)) ([55ad77d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/55ad77dfc25482a163616ece4b300faf0ca75101))
* **frontend:** list of accessibility issues for the manage change password flow ([#1010](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1010)) ([9d94b4f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9d94b4f93fc22a58c38bf59ec941b7dc2241b91f))
* Remove old slack notification workflow, we use the GitHub Slack integration now ([572e182](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/572e182cdd2c7e06e6e02aede5dc87b8fb81b800))
* Remove old slack notification workflow, we use the official GitHub Slack integration now ([#1021](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1021)) ([572e182](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/572e182cdd2c7e06e6e02aede5dc87b8fb81b800))


### Continuous Integration

* deploy 1.8.1 to test ([#1035](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1035)) ([20fcb49](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/20fcb49e77335b3c4c4da92b7da400266a0ae804))

## [1.8.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.7.1...v1.8.0) (2025-12-09)


### Features

* **frontend:** integrate relying party information into various components and tests ([#1005](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1005)) ([af49140](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/af49140acbed22d50e2488e143fd5b2fcf20d8ab))


### Bug Fixes

* **backend:** prevent deletion of last remaining MFA factor and update validation logic ([#993](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/993)) ([a707dd2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a707dd2fad2994153ed148c56d2b3b41ad449d28))
* **frontend:** enhance name input validation ([#986](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/986)) ([ec2e813](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ec2e813246843b15fee70ffc65c14376dd143d0d))
* **frontend:** manage app figma alignment passthrough ([#983](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/983)) ([65dffc4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/65dffc412e730bcf1ca83f40a20d8d27266a2468))


### Tests

* **backend:** add additional logging for pkce code verifier and user session issue ([#1007](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1007)) ([31893c1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/31893c1ff7c2aab73d12f5e479021943abe471f5))


### Miscellaneous Chores

* **deps:** update all non-major github action dependencies ([#949](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/949)) ([77747df](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/77747df3724ad6ac4d3aab13d9519a41aa56c9c1))
* **deps:** update all patch dependencies ([#950](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/950)) ([d028900](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d028900491acc2918040e1ded1982864038a2035))


### Continuous Integration

* Publish v.1.7.1 ([#981](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/981)) ([d2da479](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d2da479bf97e6ea4564142df95d375acd164eaca))
* release 1.8.0 ([#1009](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1009)) ([6d2ebc5](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6d2ebc5fc470b51507e31fb27656222be19f8a89))

## [1.7.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.7.0...v1.7.1) (2025-12-03)


### Bug Fixes

* **backend:** 906 bugbackend pkce code challenge ([#972](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/972)) ([649f503](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/649f503a2715b66565437d99a4d8b29e213ef0c6))
* **backend:** 906 bugbackend pkce code challenge ([#978](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/978)) ([09724fd](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/09724fdb48fa29154665275562ba2dbe34779c97))
* **backend:** additional logging ([#966](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/966)) ([13eab02](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/13eab02da763eb87589fc828977f2147a9c247b4))
* **backend:** improve error handling in OTP sending process ([#977](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/977)) ([694ae3e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/694ae3e43b0a4513727b75346f86b215ee354bb4))
* **backend:** limit swagger docs to local development ([#957](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/957)) ([832097d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/832097d661a86e4a3f8892df0d1240300cf85e1d))
* **backend:** Log session requests to debug authentication issue ([#930](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/930)) ([7956362](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/79563622cc85d19acc83c4ac6a567434063245f3))
* **backend:** Remove Profile Notification ([#974](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/974)) ([fd8f561](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/fd8f561fac57eb949ec158f378af41c887507789))
* **frontend:** Display content based on language toggle ([#982](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/982)) ([cfd4025](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/cfd40258441b2129e503180e08841dae4baa752f))
* **frontend:** Edit Language Preference success page Signout button now signs user out ([#928](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/928)) ([625458c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/625458c49e5e65616c32601a0c08391d7389f7ea))
* **frontend:** Edit name - Remove link to "Connected Services" after updating name ([#947](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/947)) ([b4fa188](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b4fa18880bcad02d3b911232b61a63cf6bc71276))
* **frontend:** improve storybook tests with better design standards ([#936](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/936)) ([80cce0a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/80cce0af00ca6d26a00cd2c504e9162bf3934850))
* **frontend:** Password Error Message ([#959](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/959)) ([6af36a7](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6af36a73a4bdbc41b0ba95fb81374a8488712ac5))
* **frontend:** Remove blank link for Password Recovery ([#945](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/945)) ([0c2ace0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/0c2ace0d3863b179302a14e9c71d5815d4e051b3))
* **frontend:** update French translation for last password change date ([#943](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/943)) ([47889f8](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/47889f87f7ed4ba0c46a57af0fff951275ff14d7))
* MFA phone number selected is now used, rather than defaulting to the first phone number ([27bd082](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/27bd0829ac49e8972672266191ebfd7eab878e51))
* MFA phone number selected is now used, rather than defaulting to… ([#932](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/932)) ([27bd082](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/27bd0829ac49e8972672266191ebfd7eab878e51))
* missing link for alternate MFA method setup in Add MFA Flow ([#921](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/921)) ([d0df229](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d0df2294027ddc39990ed21b8b14d2e70d8fb841))
* Update release-please to bump staging version, not test version ([#946](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/946)) ([c55a8db](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c55a8dbe3220d300dd0d95910040ab873866447b))


### Code Refactoring

* **frontend:** edit name flow to follow design pattern in add mfa ([#955](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/955)) ([9421430](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9421430773f643660113ee22e7b26987bbd74178))
* **frontend:** Language Preference Components and Update Routing ([#961](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/961)) ([b5d0bfe](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b5d0bfe3c2b627aef2306f406ccdbeccf5544e48))
* **frontend:** remove unused components and update routes ([#976](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/976)) ([15061a0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/15061a03659265148ee55c7e100df0dac718f49b))


### Tests

* **backend:** Update logging ([#970](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/970)) ([e0d4283](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e0d4283c4474c79fec1e2a01e65acb67eb883f27))


### Miscellaneous Chores

* **deps:** update all minor dependencies ([#922](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/922)) ([89a3e09](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/89a3e098786559ddae81dc4b0ca914a8ef94934a))
* **deps:** update all patch dependencies ([#908](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/908)) ([8d7faac](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8d7faac2b3152260bf9cc6af9a493882872d5da1))
* **deps:** update github/codeql-action action to v3.31.2 ([#909](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/909)) ([acf49a8](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/acf49a8dcabdc340d85f98d3053837a1a8846d38))


### Continuous Integration

* bump staging version ([#925](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/925)) ([021a357](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/021a35799cf08e0ec37bce3befbe6610b7dadfdd))

## [1.7.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.6.0...v1.7.0) (2025-11-13)


### Features

* add accept language header for otp endpoints ([#905](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/905)) ([a5059a9](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a5059a95e4a52f55c52d523a937ad28e7abdce55))
* **backend:** implement the password verification endpoint ([#882](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/882)) ([a8254a3](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a8254a31d30e728367621588de61c108a7c6ceed))
* **ci/cd:** Deploy manage to staging ([#864](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/864)) ([e83ac3b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e83ac3b03d551e7bf5287381be2015425638ff90))
* **frontend:** add tests for add mfa phone number pages ([#868](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/868)) ([c935135](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c935135b060bfb6a733e0c0b7a00384ccd54c93a))
* **frontend:** change password revise otp verification page to align with figma ([#872](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/872)) ([e2c0c7d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e2c0c7d159de9707081e9974d57e8c0a092d7001))
* **frontend:** implement password verification step ([#880](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/880)) ([9106987](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9106987599027a9f00547819c27cf67b9ae2ca1a))
* Improve accessibility attributes across components. Enable testing to throw errors on a11y violations ([#914](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/914)) ([7ef43d9](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7ef43d9d7b744202547d66542e9f943af066eeed))


### Bug Fixes

* **backend:** Adding the SecWeb middleware in default setting ([#844](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/844)) ([8bbbdee](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8bbbdee4750ad7afdf2cabb1600177afb940d5c2))
* **backend:** Comment out secweb integration ([#891](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/891)) ([3e0a107](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3e0a107a7b219af9bcc3eb8994dad78aff403287))
* **backend:** duplicate schema name ([#885](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/885)) ([e558531](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e55853143e55e8f8bcada5a54262ba2b54c8f5be))
* **backend:** streamline search parameters for user OTP factors API call ([#893](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/893)) ([45cb2b7](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/45cb2b7046d1bf15b31d97cee1ab81446236f5f1))
* Empty contact phone number displayed as verified ([#916](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/916)) ([2fe06df](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2fe06df5d575dd7a1b28547adc0b77c4960cbe44))
* **frontend:** Add MFA tests sometimes failing ([#871](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/871)) ([96ce13f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/96ce13f6c3d0c277601d2f8f0f5b31869b4ebbfd))
* **frontend:** enhance error message handling ([#896](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/896)) ([a576de8](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a576de8b560cb82a315611727f077f3ef783ce7f))
* **frontend:** update password guidelines for clarity in English and French translations ([#894](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/894)) ([5d0fa32](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5d0fa3205acf90a00da6d5a323225adeecc2aaea))
* **frontend:** updated content to match figma ([#918](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/918)) ([27fdd36](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/27fdd362fe398b8d5ed2e207c9f69826c32cba85))
* **tests:** update radio button selection and continue button queries in MFA tests ([96ce13f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/96ce13f6c3d0c277601d2f8f0f5b31869b4ebbfd))


### Miscellaneous Chores

* **deps:** update all minor dependencies ([#899](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/899)) ([030bb59](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/030bb5907370152a47b5a591d46c1c34ef283630))
* **deps:** update all non-major github action dependencies ([#831](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/831)) ([ab403cd](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ab403cd6a46b615d1403353f9d281ab933672648))
* **deps:** update all non-major github action dependencies ([#898](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/898)) ([01fa864](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/01fa864ceeccc57e2f55f11bcc7b7dd0c427e023))
* **deps:** update all patch dependencies ([#878](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/878)) ([b82f1c5](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b82f1c53a812bfe29e5b78b409ef2c93e1c0cfb7))
* **deps:** update dependency phonenumbers to v9.0.17 ([#897](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/897)) ([7fde972](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7fde972bab343dad502c0d58cb8391cacff39d7d))
* **deps:** update dependency uvicorn to v0.38.0 ([#879](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/879)) ([31889d2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/31889d23fa1f57f3854c8a17ab9eec86a69f00e4))

## [1.6.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.5.0...v1.6.0) (2025-10-21)


### Features

* **frontend:** add tests for delete mfa phone number pages ([#862](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/862)) ([35672ea](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/35672ead3e1a0a596229e1b141adcb9c38879cf9))


### Code Refactoring

* **backend:** updated the mask phone number return type  and upd… ([#856](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/856)) ([82fe70c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/82fe70cf1d5b2555605408f3c60d8f7639e770ee))
* **CI/CD:** Clarify name of backend code coverage job ([#854](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/854)) ([1f7d59d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/1f7d59daeba2497513c01a94617e39560ecf19b9))
* **frontend:** removed edit profile from reducer ([#858](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/858)) ([fd8ddbe](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/fd8ddbe6d670db5acaf2464f14ce569a991ed332))


### Miscellaneous Chores

* **deps:** update all minor dependencies ([#852](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/852)) ([0e40470](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/0e40470f8940a2be0eba0aa4116c351b282ca051))
* **deps:** update dependency phonenumbers to v9.0.16 ([#851](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/851)) ([1a236db](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/1a236dbf4c69a8f9552071ee3484d62b7888790d))
* **deps:** update mcr.microsoft.com/devcontainers/go:bullseye docker digest to 80c933b ([#850](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/850)) ([85426be](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/85426be297cc6759d8080c95ebe7b7bac831f5f6))

## [1.5.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.4.0...v1.5.0) (2025-10-16)


### Features

* **backend:** enable PKCE ([#842](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/842)) ([9530474](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/95304740a732fccb16bb385ef117a02a413738ab))
* **CI/CD:** Notify Slack when PR's merge ([#845](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/845)) ([51825c3](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/51825c3e4e53d2738a87fe9925fb3bc399eedf67))


### Bug Fixes

* **deps:** update all minor dependencies ([#832](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/832)) ([2d2a243](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2d2a243ec8ff2f26132a57f17d00e7f5c0ad1e3f))


### Tests

* **backend:** Create unit test for auth module ([#828](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/828)) ([ae2673a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ae2673aa47a4e4bb1ea68b640617f4c8aa74d818))
* **frontend:** create unit tests for the language components ([#839](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/839)) ([35a7cf7](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/35a7cf721a96075194fc482f1ff6d006197c6767))


### Miscellaneous Chores

* **deps:** update all patch dependencies ([#833](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/833)) ([feb38f2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/feb38f2bd56dcaf58ddc2c529d894692462512fe))
* **deps:** update dependency authlib to v1.6.5 [security] ([#830](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/830)) ([6b4727e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6b4727e6c997d912a28fa20f57f72d24d15ed223))

## [1.4.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.3.2...v1.4.0) (2025-10-10)


### Features

* **frontend:** delete a mfa phone number manage security settings ([#824](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/824)) ([b1f22fa](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b1f22fa7709cf846f59f7c0b9a6584115e804928))

## [1.3.2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.3.1...v1.3.2) (2025-10-10)


### Bug Fixes

* **CI/CD:** Fix env reference in deploy notifications ([#818](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/818)) ([0bfa22f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/0bfa22f548f51004395eaf9ab0b2f8477624c56e))
* **frontend:** reduce re-render when new SSE ([#820](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/820)) ([d274d90](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d274d90a88ce2ed707dfb257c85ffd317dbe4f35))

## [1.3.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.3.0...v1.3.1) (2025-10-09)


### Bug Fixes

* **CI/CD:** Include application name in deployment slack notification ([#816](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/816)) ([c01a686](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c01a6865ca5c163adfe4bc2d7aff18e64563be1a))

## [1.3.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.2.0...v1.3.0) (2025-10-09)


### Features

* **backend:** implement 2fa enrolment endpoints ([#795](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/795)) ([ff81ddd](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ff81ddd4b29a7e34963afad73894f725e386d2cf))
* **backend:** implement 2fa otp and validation endpoints ([#800](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/800)) ([7185335](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7185335a8162933f276b0e77e66d16d1f003fcc5))
* **CI/CD:** Slack notifications for manage deploys ([#814](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/814)) ([87b84d1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/87b84d11d60f390781d35abd1a0b40d6c64c8525))
* **frontend:** 2 step verification settings landing page ([#788](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/788)) ([354beed](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/354beed365a337787d572eec73a8b5d66e7762a5))
* **frontend:** add a 2fa phone number manage security settings ([#802](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/802)) ([be12178](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/be121784a8eb6486dd0f4894b41990e0527430bf))


### Bug Fixes

* **CI/CD:** Add more sections to the release-please changelog ([#791](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/791)) ([1e97b6d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/1e97b6dc96845de96d75da8ba69a938b141200eb))
* **security:** Potential fix for code scanning alert no. 3: Workflow does not contain permissions ([#808](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/808)) ([edbd302](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/edbd302c30452def0f1721152e9f991218401ea0))
* **security:** Potential fix for code scanning alert no. 37: Workflow does not contain permissions ([#803](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/803)) ([6223354](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6223354ed9bb24d74809dcde77cc1bc2288d8d6f))
* **security:** Potential fix for code scanning alert no. 4: Workflow does not contain permissions ([#807](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/807)) ([92d9967](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/92d99674b585655e403aeaaf2faf59946c05329d))
* **security:** Potential fix for code scanning alert no. 6: Workflow does not contain permissions ([#806](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/806)) ([9f2efa4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9f2efa423331647a2abba11d7ae4297fa2d8972c))
* **security:** Potential fix for code scanning alert no. 7: Workflow does not contain permissions ([#805](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/805)) ([59cccdf](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/59cccdfe83b41c940635150ef6b95279e6e94295))
* **security:** Remove dependency on python-jose ([#809](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/809)) ([adc932e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/adc932e16739dbf09f75a613123030316062560f))


### Tests

* **backend:** apply best practice to send transient unit test ([#796](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/796)) ([d7db669](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d7db6692ecefa5966a92605dc21433501ffdfa42))
* **backend:** Apply best practice to verify transient module ([#801](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/801)) ([92ad6d0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/92ad6d0f583e47bb73a9391737cb44d0c2b38e83))
* **backend:** Update unit test for OTP retrieve transient ([#789](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/789)) ([ba27d82](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ba27d821caa3ae12800861a09e0bfe9430dab34f))
* **frontend:** Implemented unit test for display phone numbers ([#738](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/738)) ([e1a1647](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e1a16473828870e14233e38be6fbb79faca96612))


### Miscellaneous Chores

* **deps:** update all minor dependencies ([#768](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/768)) ([dfcce8a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/dfcce8a676b1042502b9e73a9a0c00646e97bd9a))
* **deps:** update dependency fastapi-cli to v0.0.13 ([#769](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/769)) ([f83d591](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/f83d5912b87818eff890e7c08509754046964e6b))
* **deps:** update dependency phonenumbers to v9.0.15 ([#797](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/797)) ([bf107f4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/bf107f497e5df81b4e831dc9fe0a70d9dc7a48d6))
* **deps:** update github/codeql-action action to v3.30.4 ([#767](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/767)) ([ff43fb8](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ff43fb8978e689e2b891a7804216ccec42538fcb))
* **deps:** update github/codeql-action action to v3.30.5 ([#798](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/798)) ([5b3b55e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5b3b55e62e70a513e92b9f7620b50653146b9727))

## [1.2.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.1.0...v1.2.0) (2025-10-02)


### Features

* **CI/CD:** Setup codeowners for our deploys ([#771](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/771)) ([a7e451c](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/a7e451cf40779868c83637989e385752bfd24d89))


### Bug Fixes

* **CI/CD:** Build per-enironment and re-enable deployment pipeline ([#783](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/783)) ([d0d58e6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d0d58e617a10da44d39f34a73c0c29af32c9fc29))
* **CI/CD:** Update release pipeline to account for the `v` in created tags ([#774](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/774)) ([80ba645](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/80ba6458585e81a2185bbe6189583eed59447fa2))
* **frontend:** update manage french translation to match figma ([#782](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/782)) ([31396b8](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/31396b88444459b5bf6e72b06c17c47e33798e40))

## [1.1.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.0.0...v1.1.0) (2025-09-29)


### Features

* Add build backend step to new release pipeline ([#747](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/747)) ([89db92a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/89db92acdf0cc0a71880825a99a2269fbe7108e1))
* Add build frontend step to new release pipeline ([#748](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/748)) ([98cecb0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/98cecb03925503eb87c2d2a7d40389230f4c2869))
* Add release-please to the manage repo ([#707](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/707)) ([bc817be](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/bc817beeb1f3f9d8f59293eccbe3056d410c4a3a))
* Backend Session Extension EndPoint ([#660](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/660)) ([9bc6a6f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/9bc6a6f3c1c082879d282714fd17759ee3c471c6))
* Bones of the new release pipeline ([3fae8bb](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3fae8bb2a82993cae0052e5bbee1e227070fd9a6))
* **CI/CD:** Add backend-deploy job to release-pipeline workflow ([#763](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/763)) ([42a4df3](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/42a4df306200a0d281aa3143b0ad077273334ce5))
* **CI/CD:** Fully switch-over to new release pipeline ([#770](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/770)) ([6811f27](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6811f2768b69435273b0a9240bc9c5eb1d33ce00))
* **CI/CD:** Workflow step to deploy frontend manage application ([#758](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/758)) ([1b65895](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/1b65895f3e9767fba63d39e9852d51adbeba0fa5))
* **frontend:** Add Contact Phone Number ([#719](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/719)) ([5681f32](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5681f32aaa7a494febb89f47d385afb2777bf24a))
* **frontend:** Display the users Contact Phone Number on the profile page ([#731](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/731)) ([7614829](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/76148295f325ea2f3a6f44c098b902e31c8be51a))
* **frontend:** timeout warning with minor backend fix ([#736](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/736)) ([8d67543](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8d675434ebb5c673cdca7d73e666046dc918d5ab))
* Outline of the new release pipeline workflow ([#732](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/732)) ([3fae8bb](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3fae8bb2a82993cae0052e5bbee1e227070fd9a6))
* session management time out ([#658](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/658)) ([3e8cc0a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/3e8cc0af086f0cb05e52ffc5c58505d44c669c39))


### Bug Fixes

* 703 front end 2 step verification icons ([#705](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/705)) ([72eee1a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/72eee1a02cdb7f1d7c942730d2b6c6aaa9f13481))
* **backend:** mask profile contact phone numbers when getting a profi… ([#741](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/741)) ([d94dee4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d94dee449e12649799ce6b0b0b2672f75da65b31))
* **backend:** mask profile contact phone numbers when getting a profile and after a profile has been updated ([d94dee4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d94dee449e12649799ce6b0b0b2672f75da65b31))
* **backend:** remove await from raise_for_status() ([#742](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/742)) ([c38f8d2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c38f8d21cfdbed3422246036a9d6340bd019c527))
* **CI/CD:** Update release-pipeline workflow to use new backend OIDC role ([#752](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/752)) ([5e17eed](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5e17eedb60f6075b1ef91c4d94385b55065d9b6b))
* **deps:** update all minor dependencies ([#216](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/216)) ([43403af](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/43403af3fe4c9e8c4dffdbdf96f22f5d17a9dbce))
* **deps:** update all minor dependencies ([#339](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/339)) ([56904eb](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/56904eb194d66fdaf889f4dbf145dc676c7de5b7))
* **deps:** update all minor dependencies ([#503](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/503)) ([54e404e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/54e404e9eb8ef92fd2875f6b458292fd4de255c7))
* **deps:** update all minor dependencies ([#577](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/577)) ([c71a45b](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c71a45bb8a923b600e1bd972b3bb9b58e37883f7))
* **deps:** update all minor dependencies ([#608](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/608)) ([54bac14](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/54bac14e474317e7319c28d1e628383857667210))
* **deps:** update all minor dependencies ([#651](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/651)) ([5c2c375](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/5c2c37562f41ee2995a0c4e31f46afda30bcd4e3))
* **frontend:** Remove edit link next to the email ([#745](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/745)) ([f6ae962](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/f6ae96203a20aad86e86e10c86d74193098c0507))
* **frontend:** Remove NAVIGATION_LINKS constants and update related components ([#750](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/750)) ([b5b6944](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b5b69442591064e4257b3be0e21de38ec0babb07))
* Use extra-files feature of release-please to tidy up our workflow ([#716](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/716)) ([043a0d0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/043a0d0da0d7775efb2f9c599b6fcec3326c2e66))
* Use SRE bot token instead of GITHUB_TOKEN in release-please workflow  ([#711](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/711)) ([0f93159](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/0f93159de896143846c75c67d53de78f22eb92f1))
