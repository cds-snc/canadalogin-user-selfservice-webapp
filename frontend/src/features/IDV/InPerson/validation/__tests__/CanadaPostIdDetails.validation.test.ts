import { describe, expect, it } from "vitest";
import {
  type CanadaPostIdDetailsFormData,
  getCanadaPostIdDetailsValidation,
  isValidCanadianPostalCode,
} from "../CanadaPostIdDetails.validation";

const VALID_FORM: CanadaPostIdDetailsFormData = {
  documentOptionId: "1",
  country: "CA",
  province: "ON",
  firstName: "Jane",
  lastName: "Doe",
  dateOfBirth: "1990-05-15",
  address: "123 Main St",
  cityTown: "Ottawa",
  postalCode: "K1A 0B1",
};

describe("isValidCanadianPostalCode", () => {
  it.each(["K1A 0B1", "k1a0b1", " H2X 1Y4 "])("accepts %s", (value) => {
    expect(isValidCanadianPostalCode(value)).toBe(true);
  });

  it.each(["", "12345", "D1A 0B1", "K1A-0B1"])("rejects %s", (value) => {
    expect(isValidCanadianPostalCode(value)).toBe(false);
  });
});

describe("getCanadaPostIdDetailsValidation", () => {
  it("is valid when every visible field is filled correctly", () => {
    const result = getCanadaPostIdDetailsValidation(VALID_FORM, {
      showProvince: true,
      idHasAddress: false,
    });

    expect(result).toEqual({ isFormValid: true, errorCodes: {} });
  });

  it("reports every missing required field", () => {
    const empty = Object.fromEntries(
      Object.keys(VALID_FORM).map((key) => [key, ""]),
    ) as unknown as CanadaPostIdDetailsFormData;

    const result = getCanadaPostIdDetailsValidation(empty, {
      showProvince: true,
      idHasAddress: false,
    });

    expect(result.isFormValid).toBe(false);
    expect(result.errorCodes).toEqual({
      province: "required",
      firstName: "required_or_invalid",
      lastName: "required_or_invalid",
      dateOfBirth: "required",
      address: "required",
      cityTown: "required",
      postalCode: "required_or_invalid",
    });
  });

  it("ignores province when it is not displayed", () => {
    const result = getCanadaPostIdDetailsValidation(
      { ...VALID_FORM, province: "" },
      { showProvince: false, idHasAddress: false },
    );

    expect(result.isFormValid).toBe(true);
  });

  it("makes address optional when ID has an address", () => {
    const result = getCanadaPostIdDetailsValidation(
      { ...VALID_FORM, address: "" },
      { showProvince: true, idHasAddress: true },
    );

    expect(result.isFormValid).toBe(true);
    expect(result.errorCodes.address).toBeUndefined();
  });

  it("requires address when ID does not have an address", () => {
    const result = getCanadaPostIdDetailsValidation(
      { ...VALID_FORM, address: "" },
      { showProvince: true, idHasAddress: false },
    );

    expect(result.isFormValid).toBe(false);
    expect(result.errorCodes.address).toBe("required");
  });
});
