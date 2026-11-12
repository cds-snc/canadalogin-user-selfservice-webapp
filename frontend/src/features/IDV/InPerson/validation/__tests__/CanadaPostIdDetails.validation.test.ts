import { describe, expect, it } from "vitest";
import {
  type CanadaPostIdDetailsFormData,
  getCanadaPostIdDetailsValidation,
  getIdExpiryValidationError,
  isValidCanadianPostalCode,
} from "../CanadaPostIdDetails.validation";

const TODAY = new Date(2026, 9, 20);

const VALID_FORM: CanadaPostIdDetailsFormData = {
  idExpiryDate: "2030-01-01",
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

describe("getIdExpiryValidationError", () => {
  it.each([
    ["", "required"],
    ["2030-02-30", "invalid"],
    ["not-a-date", "invalid"],
    ["2026-10-19", "too_soon"],
    ["2026-11-19", "too_soon"],
    ["2026-11-20", null],
    ["2031-01-01", null],
  ])("returns %s -> %s", (value, expected) => {
    expect(getIdExpiryValidationError(value, TODAY)).toBe(expected);
  });
});

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
    const result = getCanadaPostIdDetailsValidation(
      VALID_FORM,
      { showCountry: true, showProvince: true },
      TODAY,
    );

    expect(result).toEqual({ isFormValid: true, errorCodes: {} });
  });

  it("reports every missing required field", () => {
    const empty = Object.fromEntries(
      Object.keys(VALID_FORM).map((key) => [key, ""]),
    ) as unknown as CanadaPostIdDetailsFormData;

    const result = getCanadaPostIdDetailsValidation(
      empty,
      { showCountry: true, showProvince: true },
      TODAY,
    );

    expect(result.isFormValid).toBe(false);
    expect(result.errorCodes).toEqual({
      idExpiryDate: "required",
      documentOptionId: "required",
      country: "required",
      province: "required",
      firstName: "required_or_invalid",
      lastName: "required_or_invalid",
      dateOfBirth: "required",
      address: "required",
      cityTown: "required",
      postalCode: "required_or_invalid",
    });
  });

  it("ignores country and province when they are not displayed", () => {
    const result = getCanadaPostIdDetailsValidation(
      { ...VALID_FORM, country: "", province: "" },
      { showCountry: false, showProvince: false },
      TODAY,
    );

    expect(result.isFormValid).toBe(true);
  });
});
