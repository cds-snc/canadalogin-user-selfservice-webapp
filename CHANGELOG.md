# Changelog

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
