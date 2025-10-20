import { SERVICES, SUBMIT_END_POINTS } from "../../../utils/constants.jsx";
export const TEST_USERS = new Map([
  [
    "test@test.gc.ca",
    {
      emailOtp: "441234",
      smsOtp: "515136",
      voiceOtp: "151136",
      login: "testUser12345",
    },
  ],
]);
export const TEST_PROTOTYPES = new Map([
  [
    "email",
    {
      mobileUrl:
        "https://www.figma.com/proto/Et4mcEGQ92y1Fl7iu4y7is/Pilot-Usability-Test-Prototype?page-id=18%3A1007&node-id=98-6298&viewport=263%2C646%2C0.82&t=Iw4k7fo5gthLDwb4-8&scaling=min-zoom&content-scaling=fixed&hotspot-hints=0&hide-ui=1",
      desktopUrl:
        "https://www.figma.com/proto/Et4mcEGQ92y1Fl7iu4y7is/Pilot-Usability-Test-Prototype?page-id=18%3A1006&node-id=49-6234&p=f&viewport=50%2C250%2C0.8&t=StkDWwaRG7cFfwE4-8&scaling=min-zoom&content-scaling=fixed&hotspot-hints=0&hide-ui=1",
    },
  ],
  [
    "sms",
    {
      mobileUrl:
        "https://www.figma.com/proto/Et4mcEGQ92y1Fl7iu4y7is/Pilot-Usability-Test-Prototype?page-id=18%3A1003&node-id=98-6274&viewport=1312%2C1238%2C1.03&t=NJPA8cShNZf0g6qA-8&scaling=min-zoom&content-scaling=fixed&hotspot-hints=0&hide-ui=1",
      desktopUrl:
        "https://www.figma.com/proto/Et4mcEGQ92y1Fl7iu4y7is/Pilot-Usability-Test-Prototype?page-id=18%3A1003&node-id=98-6274&viewport=1312%2C1238%2C1.03&t=NJPA8cShNZf0g6qA-8&scaling=min-zoom&content-scaling=fixed&hotspot-hints=0&hide-ui=1",
    },
  ],
  [
    "voice",
    {
      mobileUrl: "https://app.gc-signin.cdssandbox.xyz/en/phoneotp",
      desktopUrl: "https://app.gc-signin.cdssandbox.xyz/en/phoneotp",
    },
  ],
  [
    "signUpRedirect",
    {
      mobileUrl:
        "https://www.figma.com/proto/Et4mcEGQ92y1Fl7iu4y7is/Pilot-Usability-Test-Prototype?page-id=18%3A1002&node-id=21-1415&p=f&viewport=435%2C109%2C0.42&t=QboqD6UYjdJd7wVn-8&scaling=min-zoom&content-scaling=fixed&hotspot-hints=0&hide-ui=1",
      desktopUrl:
        "https://www.figma.com/proto/Et4mcEGQ92y1Fl7iu4y7is/Pilot-Usability-Test-Prototype?page-id=18%3A1005&node-id=37-1445&p=f&viewport=163%2C118%2C0.51&t=4EvuCHaprUKVeBwU-8&scaling=min-zoom&content-scaling=fixed&hotspot-hints=0&hide-ui=1",
    },
  ],
]);
export const TestDataUserProvider = {
  isLoading: false,
  userData: {
    service: SERVICES[0].title, //to be set later when url referrer is given, also need to refactor other pages to use this value
    language: "en", //to be set later when refactoring possibly
    email: null,
    emailLanguage: null,
    emailValidated: false,
    trxnId: null,
    passwordSubmitted: false,
    phone: null,
    stepVerificationSent: false,
    stepVerified: false,
    viewPrivacy: false,
    id: null,
    otpType: null,
    passwordValidated: false,
  },
  userProfile: {
    id: "test-user-123",
    active: true,
    details: {
      emailVerified: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      twoFactorAuthentication: true,
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    emails: [{ value: "test@example.com", type: "primary" }],
    phoneNumbers: [{ value: "+1234567890", type: "primary" }],
    meta: {
      created: "2025-09-08T12:00:00Z",
      location: "test",
      lastModified: "2025-09-08T12:00:00Z",
      resourceType: "User",
    },
    userName: "testuser",
    preferredLanguage: "en",
    name: {
      givenName: "Test",
      familyName: "User",
      formatted: "Test User",
    },
  },
  relyingPartyInfo: null,
  authenticatedPages: [],
  testData: {
    email: null,
    otp: null,
    phone: null,
    verificationCode: null,
    password: null,
    firstname: null,
    lastName: null,
  },
};

export const ACTION_TYPES = {
  link: "Link",
  submit: "Submit",
};

export const TEST_TYPES = {
  error: "Error",
  success: "Success",
  redirect: "Redirect",
};

export const POLICY_RESPONSE = {
  success: true,
  message: "Password policy retrieved successfully",
  data: {
    pwdMinLength: 12,
    pwdMaxLength: 65,
  },
};

export const SUCCESS_RESPONSE = {
  success: true,
  message: "OTP sent successfully",
  data: {
    trxnId: "eac50d6d-c2d9-47ef-a3ad-7ddc27d683b1",
    type: "emailotp",
    created: "2025-03-28T16:48:21.561Z",
    updated: "2025-03-28T16:48:21.561Z",
    expiry: "2025-03-28T16:53:21.561Z",
    state: "PENDING",
    correlationID: "7322",
    emailAddress: "test@test.com",
    attempts: 0,
    retries: 4,
  },
};

export const ERROR_RESPONSE = {
  success: false,
  message: "The system cannot process the request at this time",
  data: null,
};
export const PASSWORD_ERROR_RESPONSE = {
  data: {
    success: false,
    message: "The system detected an error.",
    data: null,
  },
  status: 400,
};
export const EMAIL_ERROR_RESPONSE = {
  data: {
    success: false,
    message:
      "value is not a valid email address: The part after the @-sign is not valid. It should have a period.",
    data: null,
  },
  status: 400,
};
export const PHONE_NUMBER_ERROR_RESPONSE = {
  data: {
    success: false,
    message: "value is not a valid phone number",
    data: null,
  },
  status: 400,
};

export const PROFILE_ERROR_RESPONSE = {
  data: {
    success: false,
    message: "Name is invalid.",
    data: null,
  },
  status: 400,
};

export const VALIDATION_CODE_ERROR_RESPONSE = {
  data: {
    success: false,
    message: "Code does not match.",
    data: null,
  },
  status: 400,
};

export const SERVER_TIMEOUT_RESPONSE = {
  status: 500,
};

export const TEST_RESPONSES = {
  signUpResponse: {
    success: true,
    message: "Email.OTP sent successfully",
    data: {
      attempts: 0,
      correlationID: "3995",
      created: "2025-04-23T11:55:43.872Z",
      emailAddress: "test@test.com",
      expiry: "2025-04-23T12:00:43.872Z",
      retries: 4,
      state: "PENDING",
      trxnId: "b3cea5a1-1e96-43d6-a4d0-0c5ba8beaa19",
      type: "emailotp",
      updated: "2025-04-23T11:55:43.872Z",
    },
  },
  verificationEmailResponse: {
    success: true,
    message: "Email OTP has been validated",
    data: null,
  },
  passwordResponse: {
    success: true,
    message: "User created successfully",
    data: {
      id: "772001COT4",
      userName: "test@test.com",
    },
  },
  verificationSmsSetUpResponse: {
    success: true,
    message: "SMS.OTP sent successfully",
    data: {
      attempts: 0,
      correlationID: "4711",
      created: "2025-04-23T12:12:56.916Z",
      phoneNumber: "14161234567",
      expiry: "2025-04-23T12:00:43.872Z",
      retries: 4,
      state: "PENDING",
      trxnId: "776aab11-e3e6-4e9d-981e-abafca74a077",
      type: "smsotp",
      updated: "2025-04-23T12:17:56.916Z",
    },
  },
  verificationVoiceSetUpResponse: {
    success: true,
    message: "Voice.OTP sent successfully",
    data: {
      attempts: 0,
      correlationID: "4711",
      created: "2025-04-23T12:12:56.916Z",
      phoneNumber: "14161234567",
      expiry: "2025-04-23T12:00:43.872Z",
      retries: 4,
      state: "PENDING",
      trxnId: "776aab11-e3e6-4e9d-981e-abafca74a077",
      type: "voiceotp",
      updated: "2025-04-23T12:17:56.916Z",
    },
  },
  verificationSmsResponse: {
    success: true,
    message: "Transient sms OTP has been validated",
    data: null,
  },
  verificationVoiceResponse: {
    success: true,
    message: "Transient voice OTP has been validated",
    data: null,
  },
};

export const MSW_MOCKS = {
  passwordPolicy: {
    type: "get",
    endpoint: SUBMIT_END_POINTS.requestPasswordPolicy,
    response: POLICY_RESPONSE,
  },
  transientOtpSend: {
    emailError: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: EMAIL_ERROR_RESPONSE,
    },
    error: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: ERROR_RESPONSE,
    },
    serverTimeOut: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: SERVER_TIMEOUT_RESPONSE,
    },
    emailSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: TEST_RESPONSES.signUpResponse,
    },
    smsSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: TEST_RESPONSES.verificationSmsSetUpResponse,
    },
    voiceSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: TEST_RESPONSES.verificationVoiceSetUpResponse,
    },
    phoneError: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: PHONE_NUMBER_ERROR_RESPONSE,
    },
  },
  transientOtpVerify: {
    error: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpVerify,
      response: VALIDATION_CODE_ERROR_RESPONSE,
    },
    serverTimeOut: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpVerify,
      response: SERVER_TIMEOUT_RESPONSE,
    },
    emailSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpVerify,
      response: TEST_RESPONSES.verificationEmailResponse,
    },
    smsSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpVerify,
      response: TEST_RESPONSES.verificationSmsResponse,
    },
    voiceSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpVerify,
      response: TEST_RESPONSES.verificationVoiceResponse,
    },
  },
  create: {
    error: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.create,
      response: PASSWORD_ERROR_RESPONSE,
    },
    serverTimeOut: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.create,
      response: SERVER_TIMEOUT_RESPONSE,
    },
    success: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.create,
      response: TEST_RESPONSES.passwordResponse,
    },
  },
  login: {
    error: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.login,
      response: PASSWORD_ERROR_RESPONSE,
    },
    serverTimeOut: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.login,
      response: SERVER_TIMEOUT_RESPONSE,
    },
    success: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.login,
      response: TEST_RESPONSES.passwordResponse,
    },
  },
  otpSend: {
    error: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpSend,
      response: ERROR_RESPONSE,
    },
    serverTimeOut: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpSend,
      response: SERVER_TIMEOUT_RESPONSE,
    },
    emailSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpSend,
      response: TEST_RESPONSES.signUpResponse,
    },
    smsSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpSend,
      response: TEST_RESPONSES.verificationSmsSetUpResponse,
    },
    voiceSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpSend,
      response: TEST_RESPONSES.verificationVoiceSetUpResponse,
    },
  },
  otpVerify: {
    error: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpVerify,
      response: VALIDATION_CODE_ERROR_RESPONSE,
    },
    serverTimeOut: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpVerify,
      response: SERVER_TIMEOUT_RESPONSE,
    },
    smsSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpVerify,
      response: TEST_RESPONSES.verificationSmsResponse,
    },
    voiceSuccess: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.otpVerify,
      response: TEST_RESPONSES.verificationVoiceResponse,
    },
  },
  createCoreProfile: {
    error: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.createCoreProfile,
      response: PROFILE_ERROR_RESPONSE,
    },
    serverTimeOut: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.createCoreProfile,
      response: SERVER_TIMEOUT_RESPONSE,
    },
    success: {
      type: "post",
      endpoint: SUBMIT_END_POINTS.createCoreProfile,
      response: TEST_RESPONSES.passwordResponse,
    },
  },
};
