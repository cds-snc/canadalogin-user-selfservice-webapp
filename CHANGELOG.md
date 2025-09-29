# Changelog

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
