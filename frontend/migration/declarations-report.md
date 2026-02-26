# Declarations extraction report

Generated: 2026-02-26T16:23:37.156Z

Total declaration files: 220
Total exported symbols (approx): 778

## Top files by exported symbols

- **utils/constants.d.ts** — exports: 275, size: 13422 bytes
  - vars: INVALID_OTP_ERROR_CODES, FORM_FIELDS, SERVICES, serverMapping, requestPasswordPolicy, create, createCoreProfile, transientOtpVerify, transientOtpSend, mfaEnroll, mfaSend, mfaVerify, mfaDelete, profileUpdateWithOtp, rp_info, users, passwordUpdate, logout, sessionStatus, keepAlive, passwordVerify, passwordVerifyStepup, RP_CLIENT_ID_KEY, GA_ACTIONS, button, link, text, input, NON_PROD_FEATURE, af, za, al, dz, de, ad, ao, ai, aq, ag, sa, ar, am, aw, au, at, az, bs, bh, bd, bb, be, bz, bj, bm, bt, by, bo, ba, bw, br, bn, bg, bf, bi, kh, cm, ca, cv, ea, cl, cn, cy, co, km, cg, cd, kp, kr, cr, ci, hr, cu, cw, dk, dg, dj, dm, eg, ae, ec, er, es, ee, sz, va, fm, us, et, fj, fi, ga, gm, ge, gs, gh, gi, gr, gd, gl, gp, gu, gt, gn, gq, gw, gy, gf, ht, hn, hu, cx, ac, nf, ax, ky, ic, cc, ck, fo, fk, mp, mh, um, pn, sb, tc, vg, vi, id, iq, ir, ie, is, il, it, jm, jp, jo, kz, ke, kg, ki, xk, kw, re, la, ls, lv, lb, lr, ly, li, lt, lu, mk, mg, mw, mv, ml, mt, ma, mq, mu, mr, yt, mx, md, mc, mn, me, ms, mz, mm, na, nr, np, ni, ne, ng, nu, no, nc, nz, om, ug, uz, pk, pw, pa, pg, py, nl, bq, pe, ph, pl, pf, pr, pt, qa, hk, mo, cf, ro, gb, ru, rw, eh, bl, kn, sm, mf, sx, pm, vc, sh, lc, sv, ws, as, st, sn, rs, sc, sl, sg, sk, si, so, sd, ss, lk, se, ch, sr, sj, sy, tj, tw, tz, td, cz, tf, io, ps, th, tl, tg, tk, to, tt, ta, tn, tm, tr, tv, ua, uy, vu, ve, vn, wf, ye, zm, zw
- **stories/Tests/utils/constants.d.ts** — exports: 27, size: 20365 bytes
  - vars: TEST_USERS, TEST_PROTOTYPES, active, emails, phoneNumbers, userName, preferredLanguage, icon, linkName, url, otp, verificationCode, password, firstname, lastName, message, type, updated, expiry, state, correlationID, emailAddress, attempts, retries, status, phoneNumber, endpoint
- **stories/Tests/InfoBlocks/NoticeFactory.test.stories.d.ts** — exports: 24, size: 7606 bytes
  - functions: render_1, play_1, render_2, play_2, render_3, play_3, render_4, play_4, render_5, play_5, render_6, play_6, render_7, play_7, render_8, play_8, render_9, play_9, render_10, play_10, render_11, play_11 | vars: title | default: _default
- **stories/Tests/Layout/SessionTimeoutModal.test.stories.d.ts** — exports: 16, size: 5976 bytes
  - functions: play_1, play_2, play_3, play_4, play_5, play_6, play_7, play_8, play_9, play_10, play_11, play_12, play_13, play_14 | vars: title | default: _default
- **stories/Tests/Features/MFAPhoneNumber/DeleteMFAPhoneNumber/DeleteMFAPhoneNumberConfirm.test.stories.d.ts** — exports: 13, size: 9158 bytes
  - functions: play_1, play_2, play_3, play_4, play_5, play_6, play_7, play_8, play_9, play_10, play_11 | vars: title | default: _default
- **stories/Tests/utils/gcdsTestHelpers.d.ts** — exports: 12, size: 6358 bytes
  - functions: waitForGcdsComponent, waitForGcdsComponents, waitForGcdsButton, getClickableButton, waitForTextContent, waitForPhoneNumber, waitForComponentReady, waitForGcdsNotice, waitForModal, waitForGcdsInput, waitForButtonByText | vars: DEFAULT_TIMEOUT
- **utils/functions.d.ts** — exports: 12, size: 772 bytes
  - functions: getLanguage, getLangValues, getPageContent, getContentWithVariables, getFooter, isEmailValid, isCodeValid, isPasswordValid, isNameValid, capitalizeFirstLetter, formatTime, convertLanguageToLanguageCode
- **stories/Features/TransientOtp/OtpVerification.stories.d.ts** — exports: 9, size: 1252 bytes
  - vars: title, SMSVerification, VoiceCallVerification, EmailVerification, PartialInput, CompleteInput, WithError, FrenchLanguage | default: _default
- **types/user.d.ts** — exports: 8, size: 1355 bytes
  - interfaces: UserData, Name, Email, PhoneNumber, UserProfileDetails, Meta, UserProfile, RelyingPartyInfo
- **stories/Features/LanguagePreference/EditLanguagePreferences.stories.d.ts** — exports: 8, size: 1183 bytes
  - vars: title, decorators, EnglishSelected, FrenchSelected, NoSelection, WithError, FrenchInterface | default: _default
- **stories/Features/ContactPhoneNumber/EnterPhoneNumber.stories.d.ts** — exports: 8, size: 1145 bytes
  - vars: title, decorators, Default, FilledFormSMS, FilledFormVoice, WithError, French | default: _default
- **stories/Features/ContactPhoneNumber/ConfirmUpdate.stories.d.ts** — exports: 8, size: 1010 bytes
  - vars: title, decorators, DefaultSMS, VoiceConfirmation, Loading, WithError, French | default: _default
- **stories/Features/TransientOtp/OtpSelection.stories.d.ts** — exports: 8, size: 841 bytes
  - vars: title, SingleSMSFactor, SingleVoiceFactor, MultipleFactors, DeleteMFAContext, NoFactors, French | default: _default
- **features/ManageFIDO2/utils/webAuthnUtils.d.ts** — exports: 7, size: 1528 bytes
  - functions: prepareAttestationOptions, prepareAssertionOptions, formatAttestationForServer, formatAssertionForServer, registerFIDO2Credential, authenticateFIDO2Credential, isWebAuthnSupported
- **stories/Features/ContactPhoneNumber/OtpVerification.stories.d.ts** — exports: 7, size: 1291 bytes
  - vars: title, SMSVerification, VoiceCallVerification, WithOtpCode, WithError, French | default: _default
- **stories/Features/EmailAddress/EmailOtpValidation.stories.d.ts** — exports: 7, size: 1261 bytes
  - vars: title, Default, WithOtpCode, WithError, PartialOtpCode, French | default: _default
- **stories/Features/EmailAddress/EditEmailEnterEmail.stories.d.ts** — exports: 7, size: 1100 bytes
  - vars: title, decorators, Default, FilledForm, WithError, French | default: _default
- **stories/Tests/Features/TransientOtp/OtpVerification.test.stories.d.ts** — exports: 7, size: 1092 bytes
  - vars: title, SMSVerificationFlow, VoiceCallVerificationFlow, EmailVerificationFlow, InputStateManagement, ErrorStateDisplay | default: _default
- **stories/Features/TransientOtp/PasswordVerification.stories.d.ts** — exports: 7, size: 1067 bytes
  - vars: title, Default, PasswordEntered, WithError, EmailUpdateContext, French | default: _default
- **stories/Features/LanguagePreference/ConfirmUpdate.stories.d.ts** — exports: 7, size: 877 bytes
  - vars: title, decorators, EnglishConfirmation, FrenchConfirmation, Loading, WithError | default: _default
- **stories/Features/EmailAddress/EmailConfirmUpdate.stories.d.ts** — exports: 7, size: 860 bytes
  - vars: title, decorators, Default, LongEmailAddress, NoFormData, French | default: _default
- **stories/Features/ContactPhoneNumber/EditContactPhoneNumberPage.stories.d.ts** — exports: 7, size: 735 bytes
  - vars: title, Default, OtpVerificationStep, ConfirmUpdateStep, SuccessStep, French | default: _default
- **stories/Pages/Manage/SecuritySettings/Manage2FAVerifications.stories.d.ts** — exports: 7, size: 644 bytes
  - vars: title, SinglePhoneSMSOnly, SinglePhoneBothMethods, MultiplePhones, French, EmptyState | default: _default
- **stories/Tests/Features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage.test.stories.d.ts** — exports: 6, size: 2951 bytes
  - functions: play_1, play_2, play_3, play_4 | vars: title | default: _default
- **stories/Features/ProfileName/ProfileUpdateName.stories.d.ts** — exports: 6, size: 1062 bytes
  - vars: title, decorators, Default, FilledForm, WithError | default: _default
- **stories/Features/ChangePassword/Password.stories.d.ts** — exports: 6, size: 860 bytes
  - vars: title, Default, WithError, WithOtpCode, French | default: _default
- **stories/Features/ProfileName/ConfirmUpdate.stories.d.ts** — exports: 6, size: 806 bytes
  - vars: title, decorators, Default, Loading, WithError | default: _default
- **stories/Features/EmailAddress/EmailUpdateSuccess.stories.d.ts** — exports: 6, size: 775 bytes
  - vars: title, Default, LongEmailAddress, WithoutEmailAddress, French | default: _default
- **stories/Features/ContactPhoneNumber/ViewContactPhoneNumber.stories.d.ts** — exports: 6, size: 580 bytes
  - vars: title, SinglePhoneNumber, MultiplePhoneNumbers, NoPhoneNumbers, French | default: _default
- **stories/Layout/SessionTimeoutModal.stories.d.ts** — exports: 5, size: 7810 bytes
  - vars: title, control, options, action | default: _default
- **stories/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddMFAOtpVerification.stories.d.ts** — exports: 5, size: 1142 bytes
  - vars: title, SMSVerification, VoiceVerification, WithOtpCode | default: _default
- **stories/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddMFAPhoneNumber.stories.d.ts** — exports: 5, size: 879 bytes
  - vars: title, Default, WithPhoneNumber, WithError | default: _default
- **types/api.d.ts** — exports: 5, size: 831 bytes
  - interfaces: ApiResponse, OtpResponseData, PasswordResponseData, ErrorResponse, MSWMock
- **stories/Tests/Features/TransientOtp/OtpSelection.test.stories.d.ts** — exports: 5, size: 769 bytes
  - vars: title, MultipleFactorsRadioButtons, SingleFactorNoRadios, DeleteMFAContext | default: _default
- **stories/Features/ContactPhoneNumber/SuccessfullyUpdated.stories.d.ts** — exports: 5, size: 748 bytes
  - vars: title, Default, WithoutPhoneNumber, French | default: _default
- **stories/Features/LanguagePreference/SuccessfullyUpdated.stories.d.ts** — exports: 5, size: 702 bytes
  - vars: title, decorators, EnglishUpdated, FrenchUpdated | default: _default
- **stories/Features/MFAPhoneNumber/DeleteMFAPhoneNumber/DeleteMFAPhoneNumberConfirm.stories.d.ts** — exports: 5, size: 659 bytes
  - vars: title, Default, WithError, Loading | default: _default
- **types/constants.d.ts** — exports: 5, size: 610 bytes
  - types: FlowType, NoticeType, Language, SubmitEndPointKey, PageKey
- **stories/Features/ProfileName/ViewProfileNameCard.stories.d.ts** — exports: 5, size: 585 bytes
  - vars: title, decorators, Default, LongNames | default: _default
- **components/Providers/UserProvider.d.ts** — exports: 4, size: 1590 bytes
  - interfaces: UserProfile, RelyingPartyInfo, UserState, SessionTimeoutState
- **stories/Layout/SubmitButton.stories.d.ts** — exports: 4, size: 1503 bytes
  - vars: title, tags, disabled | default: _default
- **stories/Layout/Header.stories.d.ts** — exports: 4, size: 997 bytes
  - vars: title, tags, decorators | default: _default
- **stories/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddMFAPage.stories.d.ts** — exports: 4, size: 738 bytes
  - vars: title, Default, French | default: _default
- **stories/Features/MFAPhoneNumber/DeleteMFAPhoneNumber/DeleteMFAPage.stories.d.ts** — exports: 4, size: 738 bytes
  - vars: title, Default, French | default: _default
- **stories/Features/ChangePassword/ChangePasswordIndex.stories.d.ts** — exports: 4, size: 666 bytes
  - vars: title, Default, French | default: _default
- **stories/Features/EmailAddress/EditEmailAddressPage.stories.d.ts** — exports: 4, size: 666 bytes
  - vars: title, Default, French | default: _default
- **stories/Features/ProfileName/SuccessfullyUpdated.stories.d.ts** — exports: 4, size: 649 bytes
  - vars: title, decorators, Default | default: _default
- **stories/Features/ProfileName/EditProfileNamePage.stories.d.ts** — exports: 4, size: 628 bytes
  - vars: title, Default, French | default: _default
- **stories/Features/ChangePassword/PasswordChangedConfirmation.stories.d.ts** — exports: 4, size: 614 bytes
  - vars: title, Default, French | default: _default
- **stories/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddSecondMFA.stories.d.ts** — exports: 4, size: 581 bytes
  - vars: title, Default, French | default: _default

## Recommendation (automated)

Promote high-confidence exported `interface` and `type` declarations into frontend/src/types/ as domain types.
For each file above, consider creating a corresponding file under src/types/ and exporting the interfaces/types from there.