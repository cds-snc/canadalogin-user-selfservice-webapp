import { describe, expect, it } from "vitest";

import {
  isOtpMaxAttemptsErrorCode,
  shouldDisplayOtpMaxAttempts,
} from "../otpErrorMapping";

describe("otpErrorMapping", () => {
  it("identifies expired and max-attempt backend codes", () => {
    expect(isOtpMaxAttemptsErrorCode("CSIAM0010E")).toBe(true);
    expect(isOtpMaxAttemptsErrorCode("CSIAM0023E")).toBe(true);
    expect(isOtpMaxAttemptsErrorCode("CSIAM0038E")).toBe(true);
    expect(isOtpMaxAttemptsErrorCode("otp_expired")).toBe(true);
    expect(isOtpMaxAttemptsErrorCode("otp_max_attempts")).toBe(true);
    expect(isOtpMaxAttemptsErrorCode("CSIAM0011E")).toBe(false);
  });

  it("flags attempts exhaustion from retries metadata", () => {
    expect(
      shouldDisplayOtpMaxAttempts({
        errorCode: "CSIAM0011E",
        retries: 5,
        attempts: 5,
      }),
    ).toBe(true);

    expect(
      shouldDisplayOtpMaxAttempts({
        errorCode: "CSIAM0011E",
        retries: 5,
        attempts: 4,
      }),
    ).toBe(false);
  });
});
