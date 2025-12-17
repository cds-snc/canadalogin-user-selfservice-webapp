# Changelog

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
