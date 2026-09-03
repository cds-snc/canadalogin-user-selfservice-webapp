# Changelog

## [1.32.1](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.32.0...v1.32.1) (2026-09-03)


### Bug Fixes

* manage app changeemail server error displayed when user enters an existing email address ([#2080](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2080)) ([f8053ae](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f8053ae66e03f4c9d35ce16c2f6d782f2a53b42f))

## [1.32.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.31.0...v1.32.0) (2026-09-02)


### Features

* Add participating services link to various components and update translations ([#2072](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2072)) ([1e31e6e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1e31e6e7095e16626badef0e1f2cc2f8c0e76a5f))
* Enhance email MFA handling with theme ID support ([#2047](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2047)) ([274265d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/274265d3d0e50d7488cdeefa37147096e1563733))
* Implement OTP metadata handling for better error responses and countdown management ([#2062](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2062)) ([f5bdfa5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f5bdfa5f0a4f671f30cb71c649c616d3fe57340b))
* Update external links to use dynamic GC account directory URLs based on language preference ([#2061](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2061)) ([2c22686](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2c22686a4e999eb454b61d1c54494b4c220048ec))


### Bug Fixes

* **EditEmailAddressPage:** clear error messages and reset attempts on navigating back to email entry ([#2059](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2059)) ([6e01859](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6e01859ec43ecc05dea51fb3b15d59dd8e0f1c01))
* **EditEmailEnterEmail:** add language attribute to input for accessibility ([#2067](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2067)) ([7a3955d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/7a3955dbd27710294dbff5eef30faafe5f8642be))
* **email:** allow passkey-only users to continue without phone MFA factors ([#2033](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2033)) ([6dbe97b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6dbe97bad09ce4b91c60722000488a84cb5777a2))
* **ErrorSummaryWithFocus:** enhance error link functionality to focus and scroll to linked elements on click or custom event ([#2039](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2039)) ([5765bcd](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/5765bcd7ff6db7a82e970160a05034c936096d23))
* Fix Phone Number Validation and Accessible Label Issues ([#2064](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2064)) ([ec97559](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ec97559427e2ed1a6d0d0a5cc2197f14a9158574))
* Handle existing email conflict error and update error messages for clarity ([#2065](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2065)) ([f8a8685](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f8a8685a2465d7126cc33686f81a8b7fb676b9ba))
* **ProfileUpdateNameConfirmUpdate:** update wording for clarity in name change notice ([#2060](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2060)) ([3999c74](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3999c748c9ffa75152d6536cb2402ab87193d34b))


### Code Refactoring

* **identity-verification:** Content changes to "Get ready to visit a Canad Post Location" page ([519bb6e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/519bb6ebc47858f88261ae7cd6be00cea7e48fd0))
* **identity-verification:** Content changes to "Get ready to visit a Canada Post Location" page ([#2041](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2041)) ([519bb6e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/519bb6ebc47858f88261ae7cd6be00cea7e48fd0))
* **identity-verification:** Content changes to "Prove your identity when you're ready" page EN + FR ([#2020](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2020)) ([b820055](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b820055726196f87149e9c7c5f37585ec99cd342))

## [1.31.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.30.0...v1.31.0) (2026-08-31)


### Features

* handle changing MFA email to new email ([#2018](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2018)) ([3fa51db](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3fa51db3817b7122005c12d9749343acb1f2a741))
* **identity-verification:** move styling to seperate css ([#2013](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2013)) ([86363c1](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/86363c137c4119da812e049e1f844278863f3b8d))
* **identity-verification:** send the verification method and user form data service canada canada post to idv data store ([#2009](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2009)) ([7fd58e4](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/7fd58e4c685512e3bd8fb75919b3201b10e348a9))


### Code Refactoring

* **identity-verification:** [FE] 'You are signed in with CanadaLogin' to appear only when journeyType is required ([#2021](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2021)) ([e37814b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e37814bb567216e6c63ee593c7e23e65c2538448))

## [1.30.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.29.0...v1.30.0) (2026-08-24)


### Features

* (identity-verification) implemented the online bluink integration ([#1971](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1971)) ([86b9218](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/86b92185cfa2279f97c6011549d2874878df8a64))
* Add french localization for Get ready for selfie and ID check ([#1948](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1948)) ([db484ec](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/db484ecc38d5f550cd35524a3b73e12a71535cab))
* **identity-verification:** Centralizing for formatting and validat… ([#1927](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1927)) ([00e3a91](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/00e3a917929cce8b9e4b7d78e5ef7346bed6b0bc))
* **identity-verification:** Centralizing for formatting and validation of date of birth ([00e3a91](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/00e3a917929cce8b9e4b7d78e5ef7346bed6b0bc))
* **identity-verification:** Create new utility function to get rpName ([#1870](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1870)) ([04d8cc2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/04d8cc25936c6d34e6fb1af110d6ca2f3567cba2))
* **identity-verification:** Display User Claim Info Profile Dashboard ([#1995](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1995)) ([04f1be1](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/04f1be1b6c3b334bfbaf74a372be4fccda12f692))
* **identity-verification:** IDV Data Service Integration ([#1980](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1980)) ([3b782a2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3b782a2d2359aa0d3a5facc956e474d902658186))
* **identity-verification:** Remove fallback RP Name ([#1930](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1930)) ([ca49dad](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ca49dad4b62cd28ef8760395da70b7ea64b53f59))
* **identity-verification:** remove services to generate and send verification code from repo ([#1943](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1943)) ([2cef9f0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2cef9f0fc9ddd790fca6088e38a520ae16be7fb4))
* **identity-verification:** Replace RP Name in app or logic with the ([#1933](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1933)) ([01cd22e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/01cd22e4835a8a999457d00ea564578cc475b394))
* **identity-verification:** Replace RP Name in app or logic with the new utility function created ([01cd22e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/01cd22e4835a8a999457d00ea564578cc475b394))
* **identity-verification:** ServiceCanadaCenterPage  creates in person identity verification case ([#1979](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1979)) ([3ad3e77](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3ad3e77c169ff3340fc62a1f5a59f69596521515))
* **otp-expiry:** Enhance OTP expiry handling with creation time and countdown adjustments ([#2001](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2001)) ([31949e6](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/31949e6647e20376921dce1f6167c5d24ffc138c))


### Bug Fixes

* (identity verification) Add French localization for "Prove your identity in person" page ([#1981](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1981)) ([cbc1e62](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/cbc1e622f4259f08875aab4b934defc790fe1640))
* (identity-verification) online verification scope ([#1990](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1990)) ([3e99a6e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3e99a6eff8dc10f7c7a84e8763e9c19dc5bdc6f5))
* Add French localization for "[RP Service Portal] needs you to prove your identity" ([#1931](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1931)) ([d77b188](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/d77b18885adf5dbeefce03c35f31832a42fe6704))
* Add French localization for "Get ready for provincial verification" page ([#1950](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1950)) ([d8255be](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/d8255bebd19e464b066f33d67202427e19f56944))
* Add French localization for "Get ready to visit a Service Canada Centre" page ([#1967](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1967)) ([85eaf6d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/85eaf6d3ab5546e5bd5dfcacd6b87f95d2def012))
* Add French localization for "Prove your identity online" ([#1935](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1935)) ([ee2696b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ee2696ba242a745bf1f00109a8b9df83a842e5ce))
* Add French localization to "Get ready to visit a Canada Post location" page ([#1954](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1954)) ([0060e95](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0060e95b4b0d84cf2f006c1d00b98f85d0013b19))
* add tests and improve tab navigation handling in useFirstTabPageFocus hook ([#1988](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1988)) ([e0dd608](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e0dd6087ea0f00052b2d0565daaecb3fb59df08f))
* **identify-verification:** [FE] Add French locals for "Your unique code for identity proofing at Service Canada Centre" ([#1983](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1983)) ([167cb91](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/167cb914de5fe24073d2a00f1b0d5baedaaee7de))
* **identity verification:** Add French localizations for "Confirm what will be saved to your CanadaLogin"- [#1945](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1945) ([#1958](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1958)) ([e2c9546](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e2c9546bc1767482c9b65c5e70c85102e4ee4d09))
* **identity-verification:** [FE] Add French locals for "Take your proofing barcode to a Canada Post location" page ([#1985](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1985)) ([4eae356](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/4eae356d7bd538f0dcf70cd95ab40fbab3dfe855))
* Standardize Phone Input Implementation in Manage App and Resolve Accessibility Issues ([#1939](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1939)) ([6a922a9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6a922a9799b5375bdef01a44e6a39d0fa4f9e0cf))


### Code Refactoring

* [FE] Content changes for "Get ready to visit a Service Canada Centre" ([#1987](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1987)) ([f3b63bf](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f3b63bf91aa2eba872019128eeac68bbebbc89c1))
* **i18n:** Fix some missing and unused localizations ([#1998](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1998)) ([6ab9c0f](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6ab9c0fd8a98da1e5a17b3209cca497d943fce24))
* **identity verification:** Revise UI for "Confirm what will be saved to your CanadaLogin" ([#1945](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1945)) ([32c8005](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/32c800509b60829a24bf2f9865b8beda3148f612))
* **identity-verification:** [FE Content Update] Prove your identity in person ([#1944](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1944)) ([764e8e9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/764e8e973b675ba5480cc0f33e627a432ae8c704))
* **identity-verification:** [FE] Content changes on Take your proofing barcode to a Canada Post location ([#2002](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2002)) ([114ce02](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/114ce02d4a2372ac924b9f6ca5817f57869915d9))
* **identity-verification:** [FE] Remove Identity Verification component in Security Settings ([#2008](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/2008)) ([40e6c2a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/40e6c2a88229040ba3a2a3dfbbcd451f30eed09f))
* **identity-verification:** Moved integration layer to the corre… ([#1992](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1992)) ([987eab2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/987eab2c1cac9df42ce0dcad6c9397d620fea089))
* **identity-verification:** Moved integration layer to the correct folder ([987eab2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/987eab2c1cac9df42ce0dcad6c9397d620fea089))
* updated the IDV_DATA_STORE_BASE_URL to point to aws dev2 ([86c0cd0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/86c0cd047afb13ff68d4adbb4058c5505cfa0222))
* updated the IDV_DATA_STORE_BASE_URL to point to aws dev2 ([#1970](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1970)) ([86c0cd0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/86c0cd047afb13ff68d4adbb4058c5505cfa0222))


### Miscellaneous Chores

* 244 investigate errant ecs terraform plan messages ([#1994](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1994)) ([acc16cb](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/acc16cbfb8184dfe0be46f00abe2a92f062e2098))
* **deps-dev:** bump brace-expansion from 1.1.16 to 1.1.18 in /frontend ([#1936](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1936)) ([23d050f](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/23d050f3d2af9faad03736f2a6074c726e963880))
* **deps-dev:** bump js-yaml from 4.3.0 to 4.3.1 in /frontend ([#1956](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1956)) ([6149d75](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6149d75dd80d24fc671b841ef9a2b2986bef3a97))
* **deps:** lock file maintenance ([#1905](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1905)) ([97b1ad5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/97b1ad59237cba5639d1fbbfafe0e678e72a6b80))
* **deps:** update all minor dependencies ([#1938](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1938)) ([2bb8b84](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2bb8b842746f2556da4562fc365a0b0995ab0780))
* **deps:** update all patch dependencies ([#1937](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1937)) ([a239143](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a239143190010de125f1ebcc2e887d8ccc4a80d0))
* **deps:** update github/codeql-action action to v3.37.6 ([#1959](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1959)) ([0f109ac](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0f109acc8de122ef62e5173d67d508404e7b00dc))

## [1.29.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.28.0...v1.29.0) (2026-07-29)


### Features

* **identity-verifcation:** [FE] Prove your identity in person ID 6.0 ([#1871](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1871)) ([aff35bf](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/aff35bfd139774d38fb36848093d0e8a22b3d6d6))
* **identity-verificaiton:** Update IDV Code - Service Canada Center ([#1803](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1803)) ([e7e8fd0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e7e8fd0c47c93ad24dc4bf0a49e1724a3c735436))
* **identity-verification:** [FE] Dynamic Expiry date for IDV Code and Figma updates ([#1893](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1893)) ([6fc6fa0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6fc6fa00b649fe403c7cedb898f4aae486147a31))
* **identity-verification:** Add a resend email button ([#1832](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1832)) ([268bd23](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/268bd23a0ca58bf2f8bb06abe2b2c63381fa8896))
* **identity-verification:** Added fix to re-render the useGcdsSelect… ([#1837](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1837)) ([f687ea5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f687ea5ecfea98548470c97b35d8855364a16614))
* **identity-verification:** Added fix to re-render the useGcdsSelectWidth ([f687ea5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f687ea5ecfea98548470c97b35d8855364a16614))
* **identity-verification:** Added notice to ProfileHome "Your information was successfully updated in CanadaLogin" ([#1794](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1794)) ([b798906](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b79890622911b76052cff1711565541566b73773))
* **identity-verification:** App Name should be relying party name ([#1877](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1877)) ([6fae5bf](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6fae5bfc38e158955257f5a2fa36990939b7397b))
* **identity-verification:** Format Verification Code ([#1880](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1880)) ([b0c74e8](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b0c74e89bbc668d7a145928e7c888e2447c559c0))
* **identity-verification:** Get ready for selfie and ID check [FE -Content Update] ([#1807](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1807)) ([24e83a5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/24e83a57e82dd049977659a972d7a0cc20a3c0aa))
* **identity-verification:** implement token exchange to be used for idv data store  ([#1922](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1922)) ([5cb5a2d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/5cb5a2d4ae40b0f340edb0940c3f3d863b6de7ec))
* **identity-verification:** Print Page Funtionctionality ([#1859](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1859)) ([1e27d9b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1e27d9b8de3e3411fd8ab5c3dc98ea947aba8e97))
* **identity-verification:** Store Relying Party Info in State ([#1829](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1829)) ([da9de9c](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/da9de9c615eb438e9addef461e2ee98617c6e7e1))
* **identity-verification:** your canadalogin account is connected to bc service card ([#1869](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1869)) ([eb34f73](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/eb34f73b20e51579a20b8ac0d79260d91c674428))
* POC identity linking using two ibm verify tenants ([#1873](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1873)) ([31ab637](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/31ab637be663179939d4b068f9f43014107ad9af))


### Bug Fixes

* **accessibility:** Skip to main content link not being the first tab… ([#1845](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1845)) ([55b4c31](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/55b4c31d2f428a73aaf353b2c0eedf67c497a4a3))
* **Auth:** resolve unhandled authentication error ([#1903](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1903)) ([cfe3a88](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/cfe3a88de374df2eeba95186ea9d181aaabc76c8))
* **auth:** unsupported response type CSIAQ0147E the required parameter response type is missing in the request ([#1908](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1908)) ([758ae18](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/758ae18cd73576dafac77993da0460c793c60b9f))
* **identity-verification:** Added the Id param to GcdsInput Fields ([#1836](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1836)) ([6db0f81](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6db0f816a91fbc97686121874efbb8b03bf96712))
* Replace the GA ID with the non prod ID ([210e333](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/210e3333411eaa976bddedd8bf0a228502cfc697))
* Swapped GA ID o use non-dev google analytics ID ([#1858](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1858)) ([210e333](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/210e3333411eaa976bddedd8bf0a228502cfc697))


### Code Refactoring

* **identity-verification:** [FE - Content Update] Add QC title to Prove your identity online ([#1828](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1828)) ([5fad9c0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/5fad9c0d0a0153c9b57cfc466e0b8e5a53657cf8))
* **identity-verification:** [FE - Content Update] Add QC to Get ready for provincial verification ([#1886](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1886)) ([1f42d5d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1f42d5d700927621b3ac1ec3b9a9b9ed672b05c7))
* **identity-verification:** [FE Content Update] Get ready to visit a Canada Post location - Remove "optional" ([#1924](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1924)) ([9eed7ea](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/9eed7eafbbaeec2124c3cf662f4f3431a4f7d7ab))
* **identity-verification:** [FE Content Update] Removed '(optional)' text from Service Canada Centre page form ([#1878](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1878)) ([0571ec8](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0571ec82670a9f66fb3b1be20a8e580ece4cf504))
* **identity-verification:** [FE Content] Complete identity proofing when you're ready ([#1866](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1866)) ([2c7b8b9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2c7b8b99a1c7f196d5fc98466e4f3a1f232b5cd3))
* **Identity-verification:** Get ready to visit a Service Canada Centre [FE-Content Update] ([#1857](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1857)) ([fcb93f0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/fcb93f09ec53bf060fb70b5350fc30d04a0fb0f7))
* **identity-verification:** refactor test files in idv ([#1925](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1925)) ([2bfcb65](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2bfcb65e81908a76047f067e9eea787c99b6481a))


### Miscellaneous Chores

* bump prod version to 1.28.0 ([#1843](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1843)) ([dce58e9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/dce58e927478adadfee8672e7b17cc0a6bc3424c))
* **deps:** lock file maintenance ([#1728](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1728)) ([901091c](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/901091cddc1bc848433a13f610ac663fb75b85b2))
* **deps:** update all minor dependencies ([#1727](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1727)) ([f2b385d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f2b385dd8a6063e29dbfb21d59492914b19e8b26))
* **deps:** update all minor dependencies ([#1868](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1868)) ([9dd7f3d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/9dd7f3d55f5e1664cd2cc8e20b8adfdb5bd242ad))
* **deps:** update all non-major github action dependencies ([#1725](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1725)) ([2898f48](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2898f48495356d0b9433592c2fe0fdb9d42ee36f))
* **deps:** update all patch dependencies ([#1726](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1726)) ([050f320](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/050f3208e22999fb77880c7fb19d38300cd7f1b6))
* **deps:** update all patch dependencies ([#1867](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1867)) ([8f040eb](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/8f040eb491764bc6c8be97960dbb68e6022edeb8))
* **deps:** update mcr.microsoft.com/devcontainers/python:3.14-bookworm docker digest to 0fdcf95 ([#1833](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1833)) ([d1a9c5b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/d1a9c5b0a55ea82b06b1d69821f57035fe7b4701))
* **staging:** bump version to 1.28.0 ([#1842](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1842)) ([e56d75f](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e56d75f8d1714f4dad2d4ce20cb2634c5cb325a8))

## [1.28.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.27.0...v1.28.0) (2026-07-09)


### Features

* **identity-verification:** APi to retrieve or store a Target URL ([#1816](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1816)) ([58f3c4d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/58f3c4dc8831b6418bdd732b25f06eb9066730bf))
* **identity-verification:** get and retrieve target url for IDV flow ([#1826](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1826)) ([cc99011](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/cc99011c69ba05dcc1e6e7cb0be91aa89e01718f))
* **identity-verification:** Get Ready to visit a canadapost location ([#1802](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1802)) ([72cd0ab](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/72cd0ab9e53e71b41c49bc5f37d76f38f4fb24ef))
* **identity-verification:** implement endpoint for generating unique verification codes  ([#1801](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1801)) ([1689ad0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1689ad0a74778ac82d41e3000dbe19c371cc7365))
* **identity-verification:** implement endpoint for generating unique verification codes and corresponding tests ([1689ad0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1689ad0a74778ac82d41e3000dbe19c371cc7365))
* **identity-verification:** implement rate limiting and caching for in-person verification code ([97387d9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/97387d9dfce65d6dd32b0927872b26efc23b49a4))
* **identity-verification:** send unique code email to users improvements ([#1804](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1804)) ([97387d9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/97387d9dfce65d6dd32b0927872b26efc23b49a4))


### Bug Fixes

* **accessibility:** enhance keyboard navigation focus handling in RootLayout and OTP components ([#1827](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1827)) ([859b378](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/859b378bffcaa0e475351aecef079a415c0572da))
* **fido2:** rename passkey send email in user's language ([#1814](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1814)) ([d02021a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/d02021ae244da85d92f0125b137ccaf10628d33d))
* **identity-verification:** [FE - Content Update] Prove your Identity component ([#1810](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1810)) ([012a0c3](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/012a0c3918fecdd23967ad2948faec21293f4e4e))
* **session-management:** fix infinite session status endpoint looping when extending session ([#1812](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1812)) ([a5e3965](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a5e3965a1091f62d1eca3bb31b93f648cf123d66))


### Miscellaneous Chores

* bump production version to 1.27.0 ([#1800](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1800)) ([adef8cc](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/adef8cc27f9c12b7766b5751c538ee3226091c0a))
* bump staging version to 1.27.0 ([#1798](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1798)) ([ae0ec06](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ae0ec065ea428122b65b3234664a7d49214dc861))

## [1.27.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.26.0...v1.27.0) (2026-07-06)


### Features

* **identity-verification:** Adding validation for visit canada post form ([#1721](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1721)) ([8cf8aec](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/8cf8aec040e0b993013e3afc3a4316466711c328))
* **identity-verification:** Confirm what will be saved to your CanadaLogin ([#1747](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1747)) ([b02ac4b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b02ac4bd42c73e16e3878b4439ade417a41cb900))
* **identity-verification:** implement in-person verification email flow with hardcoded code ([#1782](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1782)) ([8695ce0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/8695ce01839c7e0ff53297ac356667fde73059ba))
* **identity-verification:** Partway Through Proofing In Person ([#1779](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1779)) ([e183d75](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e183d755b28046a5c8b47bdc9196a348949971bb))
* **identity-verification:** re usable component validation visit canada post ([#1784](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1784)) ([443c4f0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/443c4f0922124908d410ad372ef35d630930f094))


### Bug Fixes

* correct French link for two-step verification methods ([#1796](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1796)) ([eaaea89](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/eaaea894582606de440f8cf30bc13277a3b17ba5))
* **identity-verification:** Fixing screen breadcrumbs ([#1750](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1750)) ([2352e04](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2352e0460c73c725090b1a30eef3a5606c87c1f2))


### Code Refactoring

* **identity-verification:** [FE] Add a success notice to Confirm what will be saved to your CanadaLogin page ([#1792](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1792)) ([94b69ed](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/94b69ed05c0a75fa3a7ef0f465a91043a2a533b5))


### Miscellaneous Chores

* bump production version to 1.26.0 ([f6f19a3](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f6f19a3a0a1e89d63b69fa234e186a2e23f5a167))
* bump production version to 1.26.0 passkey release ([#1787](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1787)) ([f6f19a3](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f6f19a3a0a1e89d63b69fa234e186a2e23f5a167))
* **version:** bump staging version to 1.26.0 ([#1786](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1786)) ([6c63673](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6c636734f42f7a1adc1451cb17ece95699eda306))

## [1.26.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.25.0...v1.26.0) (2026-06-30)


### Features

* added verification error alert on how do you want to prove your identity ([393f751](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/393f751c0b0a7c664b21c8de36e9bda6d625255b))
* **identity-verification:** Error state - added error alert message on how do you want to prove your identity page ([#1742](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1742)) ([393f751](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/393f751c0b0a7c664b21c8de36e9bda6d625255b))
* **identity-verification:** Prove your identity online ([#1695](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1695)) ([89dfa6d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/89dfa6d7128685c75c8246336bf59b428ab3daf2))


### Bug Fixes

* add help center links for passkey and two-step verification ([#1755](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1755)) ([7ce6107](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/7ce6107daf3c83a77e68532fa4bdfbed614518d6))


### Code Refactoring

* **identity-verification:** routes updated to direct user to the correct screen ([#1749](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1749)) ([447d506](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/447d506e4efb899d8952522221ee19573cc1aa15))
* **identity-verification:** update route for identityverificationsuccess component ([#1718](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1718)) ([fdae248](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/fdae248d19fa32c3b5127361d16f926877c7e730))


### Miscellaneous Chores

* bump staging version to 1.25.0 ([#1745](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1745)) ([41d9954](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/41d995441795cf12ab09b9a9ae52ea1a13fe9a49))

## [1.25.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.24.0...v1.25.0) (2026-06-29)


### Features

* **identify verification:** create generic identity proofing complete page  ([#1648](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1648)) ([5f11239](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/5f112397dc2851f917aa28eb94c06e4f63cfd506))
* **identity verification:** mock success response for online verification  ([#1711](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1711)) ([dd0a526](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/dd0a5269c62d34f9e46a06174e3b45b7a051198a))
* **identity-verification:** Add notice for "Complete Identity Proofing" ([#1676](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1676)) ([922ace1](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/922ace18ae502f8cd3f67ae67f0a34954e41da93))
* **identity-verification:** Added a new utility component for acceptable IDs ([#1664](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1664)) ([cb844cb](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/cb844cb79462bc230239e479095f73ab2c13fe06))
* **identity-verification:** Take proofing barcode to canada post ([#1706](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1706)) ([0e4f50e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0e4f50ec29285f70888d47871d340bdb7c6eaab7))
* **identity-verification:** Update  How do you want to prove your identity? ([#1673](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1673)) ([b10197d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b10197d2fc6ff35619a05a0af7976117708b2816))
* **identity-verification:** Update Complete Identity Proofing Content ([#1693](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1693)) ([8913492](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/891349201a70599c1f086d11d91e05241eaeb645))


### Bug Fixes

* 400 error when trying to delete mfas with passkey validation ([#1724](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1724)) ([0ec75c7](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0ec75c7d97493918cc0168f952b9f70637f30444))
* change userVerification setting to required in FIDO2 flows ([#1744](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1744)) ([5ac5c09](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/5ac5c09d76d072601b979a725d26ce418a52f154))
* **fido2:** Update attestation options to prefer resident key and user verification ([#1701](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1701)) ([8add456](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/8add45681b82b27ddcff04f9561441a366ddb0f6))
* **identity-verification:** Enhance identity proofing UI with dynamic content  ([#1703](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1703)) ([cedc9e3](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/cedc9e361f29e0fc87898b375272ecc317906338))
* **otp:** add '+' prefix to phone numbers in OTP enrollment ([#1720](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1720)) ([574a12b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/574a12b0921fb28d911bc6a59565c8e7c7a7173c))
* Preserve query parameters in session storage on search param change ([#1686](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1686)) ([4253f1d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/4253f1df6cee67f6a4b469d3a50bf6e829806d84))


### Code Refactoring

* **identity-verification:** Duplicate use of definition appName ([#1694](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1694)) ([e165da9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e165da9449a73c774fe6de722a37bd392e8b9d2b))
* **identity-verification:** restructure UI routes based on user journey types: start, update, required or error ([#1697](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1697)) ([978a473](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/978a473e7bb2410c4e02963635dc2afe59dfb908))


### Miscellaneous Chores

* bump staging version to 1.24.0 ([#1684](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1684)) ([df4477f](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/df4477fd923b9ab0a1a00839542c831169a88959))
* **dependencies:** update [@gcds-core](https://github.com/gcds-core) component library packages  ([#1716](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1716)) ([f31a454](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f31a45473e28827b09028960593ad0b1bc3a48ec))
* **dependencies:** update [@gcds-core](https://github.com/gcds-core) component library packages to latest versions ([f31a454](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f31a45473e28827b09028960593ad0b1bc3a48ec))
* **deps-dev:** bump form-data from 4.0.5 to 4.0.6 in /frontend ([#1631](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1631)) ([fc12b8e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/fc12b8e82d53e734cf38a14e3fa2b5197181e0c7))
* **deps:** bump cryptography from 46.0.7 to 48.0.1 in /backend ([#1630](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1630)) ([2fd4327](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2fd432773dc04c55ac0a252007648eafbfa309f1))
* **deps:** bump pydantic-settings from 2.14.1 to 2.14.2 in /backend ([#1672](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1672)) ([0bd24b9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0bd24b915adade1950030bc2604e3d0fd9930095))
* **deps:** bump pyjwt from 2.12.1 to 2.13.0 in /backend ([#1624](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1624)) ([fd3630d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/fd3630d0eba262f769b060d78b6bd154ab4c33b1))
* **deps:** bump python-multipart from 0.0.30 to 0.0.31 in /backend ([#1629](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1629)) ([f674d0c](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f674d0ca48c6be56024f817ef3e6bcae6f32b04a))
* **deps:** pin mcr.microsoft.com/devcontainers/python docker tag to 52cfd0e ([#1617](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1617)) ([fe75332](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/fe75332e98e3cf86a4345798d54f58d77811239d))
* **deps:** update all minor dependencies ([#1620](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1620)) ([3254322](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3254322f778491a5e608a991092051a12a7e11ce))
* **deps:** update all non-major github action dependencies ([#1618](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1618)) ([0e982e4](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0e982e44ea9bf84d550de5b04b74f283e9bcae01))
* **deps:** update all patch dependencies ([#1619](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1619)) ([c8bd0a2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/c8bd0a231b6480f21413e932aa1a27576e00eec4))
* **deps:** update dependency prettier to v3.8.4 ([#1671](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1671)) ([3a6160b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3a6160bcf96dc2aa2079d1ab62218fe0439d3c4d))

## [1.24.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.23.4...v1.24.0) (2026-06-22)


### Features

* **identity-verification:** Added a form component to wrap the page ([#1674](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1674)) ([a4bd8e8](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a4bd8e8de76e9ef0ea2cec46ced277013deeb969))
* **identity-verification:** Added CompleteIdentityProofing Page ([#1611](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1611)) ([0b8a74c](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0b8a74cc16ee244b5bfa2b0a7dac64d485cf3626))
* **identity-verification:** Adding Integration between Get Ready To … ([#1663](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1663)) ([1b8a9cc](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1b8a9ccf3887fc230eb204824c5930378ec33c5f))
* **identity-verification:** Adding Integration between Get Ready To Visit Canada Post and Proofing Barcode ([1b8a9cc](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1b8a9ccf3887fc230eb204824c5930378ec33c5f))
* **identity-verification:** confirm what will be saved to your canadalogin ([#1621](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1621)) ([00f555c](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/00f555cc7bc415fbe7cf84a483c01ca5768d5167))
* **identity-verification:** Creating Visit Canada Post Page ([#1642](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1642)) ([aff6911](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/aff6911f7e0d0cb5189316505f96bf9f58108ddf))
* **identity-verification:** Take your proofing barcode to Canada Post ([#1653](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1653)) ([bb69182](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/bb69182d2c1a3257c85541e839284904b9f319f6))
* **idv:** re-implement SCC page to align with new Figma designs ([#1661](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1661)) ([1ed714a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1ed714a430e0edde92709c6a24529cc3bc2c9072))
* remove passkey feature flags for release ([11411ff](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/11411ffaa437cec595afd9beefb6f8076f230d93))


### Bug Fixes

* **language-preference:** retain language selection on navigation state change ([#1656](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1656)) ([63c8290](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/63c82907cc14e411e01d1a22a66c016a93dcc937))


### Code Refactoring

* **identity-verification:** reusing canadian province array ([#1667](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1667)) ([6ba957a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6ba957a03bdf35c03c23094dddefa8ebd6e38464))


### Miscellaneous Chores

* bump version to 1.23.4 in staging.json ([#1638](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1638)) ([a0ff4f5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a0ff4f5d3f482ef07b318e64fc12a73ff69b1727))
* remove passkey feature flags for release ([#1683](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1683)) ([11411ff](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/11411ffaa437cec595afd9beefb6f8076f230d93))
* update production version to 1.23.4 in prod.json ([#1640](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1640)) ([20f6a85](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/20f6a85d94abee1a9becfcf6ef12f47519e42a1f))

## [1.23.4](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.23.3...v1.23.4) (2026-06-16)


### Bug Fixes

* 404 rp not found error in staging ([#1637](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1637)) ([386245a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/386245aca12abad025378e4ee2e81dc1933aaee8))
* skip FIDO2 lookup when at least one OTP factor remains ([386245a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/386245aca12abad025378e4ee2e81dc1933aaee8))
* update OTP verification messages and add feature flag for passkey text display ([#1635](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1635)) ([ab559d6](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ab559d6a2e6fcbd68b48928860acb7b18eae4335))


### Miscellaneous Chores

* bump version to 1.23.3 in staging.json ([#1632](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1632)) ([25be94e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/25be94eb0ba653727e793b8f5b64ade504fa7825))

## [1.23.3](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.23.2...v1.23.3) (2026-06-16)


### Bug Fixes

* add feature flag for passkey text display in ManageDashboard ([#1627](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1627)) ([a4a0e35](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a4a0e3569a3f93338ad7a2fd37dfca49957533ee))

## [1.23.2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.23.1...v1.23.2) (2026-06-12)


### Bug Fixes

* enhance OTP validation error messages for better user feedback ([#1616](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1616)) ([ed88df9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ed88df9135fa557f30aff25e19c1dde8b2867582))
* implement transient OTP verification in delete MFA flows ([#1613](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1613)) ([f099689](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f099689247d87125cc002f12f5b1c53e617c743e))
* tolerate legacy invalid characters in user profile names ([#1615](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1615)) ([fddd13a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/fddd13a029e436af9e96329326fa3bcd7af5a35f))
* Updated the .devcontainer to run python bookworn ([#1591](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1591)) ([d1d1ae9](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/d1d1ae9b67d3eaeda274af8f32cc3e77e2d73dd3))


### Miscellaneous Chores

* bump prod version ([a3ed2b2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a3ed2b2219e9882649b324bdf512b0f9900f1090))
* bump prod version 1.23.1 ([#1612](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1612)) ([a3ed2b2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a3ed2b2219e9882649b324bdf512b0f9900f1090))
* bump staging version ([#1606](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1606)) ([bf73463](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/bf73463b2dbe2c4ce62e4c11d800f8aeca4b5890))

## [1.23.1](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.23.0...v1.23.1) (2026-06-10)


### Bug Fixes

* GA changes for Manage App ([#1576](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1576)) ([c08e108](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/c08e10826d4db7a0463d3897428ca51f8e327fba))
* update IBMVerifyUserProfileSchema to prioritize details over URN alias and enhance user profile normalization ([#1604](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1604)) ([ddac734](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ddac7341452044799b918a7524416065b725eee7))


### Miscellaneous Chores

* **deps:** bump qs from 6.15.0 to 6.15.2 in /frontend ([#1482](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1482)) ([0a71829](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0a7182964640b9299994f19145382194b586dad0))
* **deps:** lock file maintenance ([#1517](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1517)) ([b702e37](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b702e37d3f10823bc26fe5fd306f5dfb3bbd7a07))
* **deps:** pin dependencies ([#968](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/968)) ([4f2b984](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/4f2b984288fc74a7a8779abbd0407d5fdcda1cef))
* **deps:** update all minor dependencies ([#1516](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1516)) ([19f52c0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/19f52c0e639d37a8de538bd79c3dd32f2d7921b2))
* **deps:** update all patch dependencies ([#1573](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1573)) ([acce785](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/acce785954c5d3fba8ba95b9152ad3b3b0a11765))


### Continuous Integration

* bump prod version to 1.23.0 ([7dfdd1e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/7dfdd1e62129ad45e453d1e0c6cf7d21e3733adb))
* bump PROD version to 1.23.0 ([#1593](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1593)) ([7dfdd1e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/7dfdd1e62129ad45e453d1e0c6cf7d21e3733adb))
* bump staging to 1.23.0 ([#1589](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1589)) ([5c10eb5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/5c10eb556ba0ec294e97930075277ef11e945fd6))

## [1.23.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.22.2...v1.23.0) (2026-06-09)


### Features

* [identity verification] update idv flow to navigate to the correct screen ([#1566](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1566)) ([8d49571](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/8d495716015e301b93cb9421666937338dccaa22))


### Bug Fixes

* change password flow go to otp validation if only one mfa factor available ([#1586](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1586)) ([528abfb](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/528abfb8c2cec0c1e987f5bb527bd0098902f9c7))
* hotfix not delete extra attribute ([#1587](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1587)) ([4e06bd0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/4e06bd04faa291b71618af98010d02028100b6ce))

## [1.22.2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.22.1...v1.22.2) (2026-06-08)


### Bug Fixes

* add success notice for OTP verification in password change flow ([#1570](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1570)) ([3448476](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/3448476fffec2a91a2594d1e66dbb8fdadf12a5b))
* Implement error handling for OTP validation and add password attempt tracking ([#1569](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1569)) ([aefdf2f](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/aefdf2fb84edb6b669b01e280d95afdbcb2b32cd))
* implement session storage management for password change redirection ([#1572](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1572)) ([e2830fb](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e2830fb5bbe7c3d9a6a03a609b1362fbfc9af258))
* refactor contact number handling to use phoneNumbers array ([#1581](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1581)) ([2831801](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/283180119bec193fa8382379f6b55303f010667f))
* update email verification messages and translations to align with design specifications ([#1571](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1571)) ([8eb9583](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/8eb95837f5c42f6284829e72be18c5833b941cb5))
* update package-lock.json to resolve vitest v4 peer dependency conflict ([#1522](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1522)) ([5efa37d](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/5efa37d61155dbfd2e6130f3ac73818a0bc4a93c))
* update password change flow to use returnToPage for redirection and remove session storage dependency ([#1575](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1575)) ([91ce6aa](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/91ce6aa4f1e0f68e70853bd4bd40a4337201f02f))
* use enrolled email in change password otp instead of profile attribute ([#1580](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1580)) ([9d9eb3f](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/9d9eb3f4bbf163df7495ad08b605f56c50cdd2d6))

## [1.22.1](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.22.0...v1.22.1) (2026-06-04)


### Bug Fixes

* Correct French translation formatting for OTP message display ([#1558](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1558)) ([ac966f7](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/ac966f73d88eb691ca98bfbcb46064d9370c823e))
* Fixed Accessibility Defect on Manage App Passkey Screen ([#1542](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1542)) ([f13bf34](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/f13bf343cb0ada3f4dff2fbe59efd1a02376c55a))
* GA implementation for rename passkey ([#1534](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1534)) ([835ceed](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/835ceedd2ea2a07e0070fc7e529bf7fc2e95eb5b))
* Underline action links in OtpSelection component to match design specifications ([#1557](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1557)) ([7eb7a12](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/7eb7a12836bec2be05a24cedea9cda23a4a72707))
* Update help center links and refactor link handling in OtpSelection and VerifyFIDO2Passkey components ([#1544](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1544)) ([8359386](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/835938630a567342f905662ba629a7bbcd921262))
* Update help center links to use production URLs for two-step verification ([#1547](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1547)) ([1ebe728](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1ebe728e629fa520640f6eae733583c3534c6b6f))
* Update password minimum length error messages to match design specifications ([#1556](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1556)) ([d4b9f15](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/d4b9f1508d4c655ebb17ceb30230492b387a7596))
* Update username retrieval logic to prioritize givenName and familyName ([#1554](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1554)) ([33c5c37](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/33c5c370f03dc1f6c3bb095e2c86f131c3a4c035))

## [1.22.0](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/compare/v1.21.0...v1.22.0) (2026-06-02)


### Features

* add FIDO2_RP_ID configuration and refactor RP ID retrieval logic ([#1504](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1504)) ([b7b8519](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b7b85194f7f15141131c716c8a64a2b193e08e36))
* add Online Verification Info component ([#1521](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1521)) ([16b8c70](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/16b8c70336fce1afe75a2cd36b0a89d143b2060b))
* passkey fr localization figma alignment ([#1525](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1525)) ([50a9eb3](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/50a9eb3dec3d7348802b964a790732990e0fc37c))


### Bug Fixes

* align add/delete passkey figma design ([#1506](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1506)) ([2c41f56](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/2c41f56c50ba4ba74ebee2245d8cd61e3bf1546d))
* align add/delete phone number with figma design ([#1498](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1498)) ([b53f4d7](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b53f4d7ff25cdeb5d29aabbaed9b53b2e5bd3fb1))
* **auth:** improve sign-out logic and handle prompt for login ([#1508](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1508)) ([4a89d1e](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/4a89d1e36efc5069cb66e8aec3e08fe203e3040f))
* Implemented GA for Passkey flow ([#1493](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1493)) ([e1d96fd](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/e1d96fd366c7e19591605eb94883a83231bac068))
* Manage 2FA landing page Figma alignment ([#1497](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1497)) ([96453ea](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/96453ea06fc0e88ebafd484ff99052c795309092))
* minor fix on UI ([#1503](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1503)) ([eb7a75b](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/eb7a75b616e4a1e7028d389c69e9f2b31b247c5e))


### Code Refactoring

* FIDO2 passkey verification Figma alignment ([#1511](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1511)) ([1c34ae7](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/1c34ae7a1f79ba5484d09c5c6e53057c7998d101))
* replace FIDO2_RP_ID with ROOT_DOMAIN in configuration and related logic ([#1532](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1532)) ([84d95d8](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/84d95d8f8cdf68ee2bf7814e9bc9c400e3733b15))
* ui align reverify otp ([#1512](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1512)) ([85d59e5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/85d59e51acd5a2e2ca1ffa2a9a51512c58e2e33a))


### Miscellaneous Chores

* **ci:** add PR title check workflow ([#1518](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1518)) ([0ab62a5](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/0ab62a52eb83863bdd9781c90ef668a8f9f1ae43))
* **deps:** lock file maintenance ([#1425](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1425)) ([a85d3fa](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/a85d3faa00ee5d8b7e5801b8e05c3040d04a56f5))
* **deps:** update all minor dependencies ([#1424](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1424)) ([c36172a](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/c36172adeadc6613a6395fab09cc3b3981cac2e6))
* **deps:** update all non-major github action dependencies ([#1090](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1090)) ([b0a7ff8](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/b0a7ff800089198cb01a6bec64be1307d9e79d32))
* **deps:** update all patch dependencies ([#1423](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1423)) ([fb748f2](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/fb748f2724263e902a572d4aa894c3a8fdffffa4))
* **deps:** update all patch dependencies ([#1515](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1515)) ([29d3bef](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/29d3bef1113ec0edaaf389c4e828101cc6f3f650))
* **deps:** update dependency authlib to v1.6.12 [security] ([#1457](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1457)) ([39866e6](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/39866e6321840fc1476276341c6a209ce187aa41))
* **deps:** update dependency axios to v1.15.2 [security] ([#1436](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1436)) ([6c77da1](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/6c77da13fb885509a774bc3bd7c149ba45c51180))
* **deps:** update dependency python-multipart to v0.0.27 [security] ([#1441](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/issues/1441)) ([0595746](https://github.com/cds-snc/canadalogin-user-selfservice-webapp/commit/059574655cd6f6f0347a523ef399286185f7aef4))

## [1.21.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.20.0...v1.21.0) (2026-05-26)


### Features

* add email otp verification for change password ([#1481](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1481)) ([db66838](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/db668384470a5445c96edaa643f76daa5b58198b))
* add passkey as option 2fa when add/delete OTP ([#1476](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1476)) ([77571e0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/77571e0a20bcbbea1e9eaf03dac0eba2a15549df))
* **frontend:** implement online provincial ID verification page ([#1485](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1485)) ([8fcb1a0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8fcb1a04276929314c28cf2792df45324f3463fa))
* **frontend:** remove cancel button from passkey nickname screen ([#1484](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1484)) ([24300f8](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/24300f8e6d46d169146e2da79e6162d7a1c024ea))
* **identity-verification:** start identity proofing ([#1468](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1468)) ([6e81585](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6e8158520ca15cd7c0ed648794445aa18b3c0ac0))
* prevent delete last 2fa otp/passkey ([#1491](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1491)) ([38e6072](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/38e607292e3603a6044f2cd6c0402efbaefbaea1))


### Bug Fixes

* improve error handling for password verification  ([#1489](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1489)) ([070e4aa](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/070e4aae7a4c4f5eb9c80547d79505c9ce1eff00))


### Miscellaneous Chores

* add LICENSE and SECURITY.md ([#1490](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1490)) ([48e9660](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/48e9660c7521ddee93da1c1834841fb2854ea415))
* bump staging deployed version to 1.20.0 ([#1471](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1471)) ([b59073a](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/b59073a50a38c8c2d28949f4b22732381cfdb987))
* update feature flag to enable passkeys in test env ([#1494](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1494)) ([f4fc8b8](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/f4fc8b877c7c4529713bd90b9bd9045ff9b10beb))


### Continuous Integration

* bump prod version 1.20.0 ([#1475](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1475)) ([ad6d328](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ad6d328e8d5763254690d4d6da30c87f68af9ecf))

## [1.20.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.19.0...v1.20.0) (2026-05-20)


### Features

* add Proven Information Card and integrate into ProfileHome component ([30d8d54](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/30d8d54959d77752b0e867034dbbebcb5c667ede))
* **frontend:** add Proven Information Card and integrate into ProfileHome component ([#1445](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1445)) ([30d8d54](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/30d8d54959d77752b0e867034dbbebcb5c667ede))
* **identity-verification:** integrate GC Notify for sending in-person verification codes ([#1463](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1463)) ([8445607](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/8445607843cba3abc8426f55016bd9e7aa4e84f6))


### Bug Fixes

* Google Analytics Error Tracking for API Endpoints ([#1461](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1461)) ([d251255](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d251255c78a75a1dddecd24dfb384816f5815ea0))


### Code Refactoring

* **config:** make Bluink Client ID and Secret optional ([#1454](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1454)) ([31760c4](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/31760c4fc1868b241bc9ef52867809800c1511fb))


### Miscellaneous Chores

* bump staging deployed version to 1.19.0 ([#1460](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1460)) ([104338e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/104338ea4f28fb2ad27df95187ee1f82d62aba0a))
* remove hardcoded API tokens from dev documentation ([32fa191](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/32fa1911ac48f309651ccc636ba739ae41725346))
* remove stale hardcoded API tokens from dev documentation ([#1464](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1464)) ([32fa191](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/32fa1911ac48f309651ccc636ba739ae41725346))


### Continuous Integration

* bump prod version 1.19.0 ([#1467](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1467)) ([447e181](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/447e181ac97056e7d2709888acd2007ce5c2e54c))
* bump prod version to 1.19.0 ([447e181](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/447e181ac97056e7d2709888acd2007ce5c2e54c))

## [1.19.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.18.0...v1.19.0) (2026-05-07)


### Features

* **frontend:** add IDV in person ssc unique id verification screen ([#1438](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1438)) ([e55e01e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e55e01e9121bfe376b6321b2b16a251f769e8f68))

## [1.18.0](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.17.2...v1.18.0) (2026-05-06)


### Features

* Add semgrep linter to catch local container state ([#1439](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1439)) ([7b1fd80](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/7b1fd803533e6ea559a3c0cd0c007a1798eccda7))
* add Service Canada Centre page and localization support ([#1433](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1433)) ([fde0996](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/fde09961d9ffe952b3d44ab99cbf83b88ec78867))


### Bug Fixes

* remove document title setting from trackPage function ([78e908d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/78e908d6855b743b3787e8e3efd05f22e23448e2))
* Remove renaming browser tab on page change ([#1435](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1435)) ([78e908d](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/78e908d6855b743b3787e8e3efd05f22e23448e2))


### Miscellaneous Chores

* bump prod deployed version to 1.17.2 ([#1432](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1432)) ([ea2d85f](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ea2d85f36c52e1329e581fc731874ce76a6f8b61))
* bump staging deployed version to 1.17.2 ([#1430](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1430)) ([c6af44e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/c6af44ec696c3b34140893ecd5f2d8f460cec8cf))

## [1.17.2](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.17.1...v1.17.2) (2026-04-29)


### Miscellaneous Chores

* update prod version to 1.17.1 ([#1429](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1429)) ([f2c7de6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/f2c7de65cf7b7bb283e4e61b6121056fa9371cbc))
* update staging version to 1.17.1 ([#1427](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1427)) ([1b8ac9e](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/1b8ac9e99b09623dc153a6a89f1697325cd8245c))

## [1.17.1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/compare/v1.17.0...v1.17.1) (2026-04-27)


### Bug Fixes

* Fix prod.json filename in CODEOWNERS definition ([#1415](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1415)) ([6cb9a97](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6cb9a975d5d5b599c3c9f5ca2a2e628bc3f10da6))
* implement OTP attempt tracking and error handling across multiple components ([#1416](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1416)) ([ac82b47](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ac82b4735404dee9b12386479d97f462f720ff9d))
* Update GCDS components to version 1.2.0 and improve language handling in RootLayout ([#1422](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1422)) ([2d4bcd3](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/2d4bcd37b3abe5b19f3efa4654d8574f93e6bbec))
* Update TopNav to use localized relying party name and URL ([#1420](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1420)) ([ab37164](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/ab371644f5dc23e7833a57321c0e46b6233d50e9))


### Miscellaneous Chores

* **deps:** update all minor dependencies ([#1400](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1400)) ([d21b3b6](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/d21b3b616ec8d8e9707358adab8ecdf48b29f318))
* **deps:** update all patch dependencies ([#1399](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1399)) ([005d9a1](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/005d9a1f98d1d799359b618aecffa9e6aa58222f))
* **deps:** update dependency prettier to v3.8.3 ([#1401](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1401)) ([e238365](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e238365ae5b01d2e0d94558b594b2fd3d3d77f2e))
* update prod deployed version to 1.17.0 ([#1414](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1414)) ([e140d80](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/e140d80bca712cf3071cd8d81ebdfb8dc1f267f8))
* update staging deployed version to 1.17.0 ([#1412](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/issues/1412)) ([6cb2c16](https://github.com/cds-snc/gc-signin-user-selfservice-webapp/commit/6cb2c1677c43da386c4ca4bcdb7dac7e8b7a8530))

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
