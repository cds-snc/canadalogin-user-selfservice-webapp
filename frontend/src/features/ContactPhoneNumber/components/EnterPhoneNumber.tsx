import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEventHandler } from "react";
import { flushSync } from "react-dom";
import { useParams } from "react-router";
import {
  AsYouType,
  CountryCode,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import {
  countryMapping,
  FLOW_TYPES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import {
  ALLOWED_PHONE_KEYS,
  COUNTRY_NAME_OVERRIDES,
  DEFAULT_COUNTRY_ISO2,
  MAX_PHONE_DIGITS,
  SUPPORTED_COUNTRY_ISO2,
} from "../../MFAPhoneNumber/AddMFAPhoneNumber/constants";
import {
  getDisplayedPhoneNumber,
  getStoredPhoneNumber,
} from "../../../utils/mfaPhoneNumber";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  ContactPhoneOtpType,
  ContactPhoneStepProps,
} from "../../../types/contactPhoneNumber";
import { trackButtonClick } from "../../../utils/gatag";

interface CountryOption {
  iso2: string;
  dialCode: string;
  countryName: string;
  label: string;
}

const getDialCodeForCountry = (countryIso2: string): string => {
  try {
    return getCountryCallingCode(countryIso2.toUpperCase() as CountryCode);
  } catch {
    return "1";
  }
};

const getCountryFlagEmoji = (countryIso2: string): string => {
  const normalizedIso2 = countryIso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedIso2)) {
    return "";
  }

  const codePoints = [...normalizedIso2].map(
    (char) => 127397 + char.charCodeAt(0),
  );

  return String.fromCodePoint(...codePoints);
};

const createCountryOptions = (
  language: string | undefined,
): CountryOption[] => {
  const displayLanguage = language === "fr" ? "fr" : "en";
  const nameOverrides = COUNTRY_NAME_OVERRIDES[displayLanguage];
  const localizedCountryNames =
    language === "fr"
      ? (countryMapping.frLocalization as Record<string, string>)
      : (countryMapping.localization as Record<string, string>);
  const displayNames = new Intl.DisplayNames([displayLanguage], {
    type: "region",
  });

  return SUPPORTED_COUNTRY_ISO2.map((iso2) => {
    const dialCode = getDialCodeForCountry(iso2);
    const upperIso2 = iso2.toUpperCase();
    const countryName =
      nameOverrides[iso2] ??
      localizedCountryNames[iso2] ??
      displayNames.of(upperIso2) ??
      upperIso2;
    const flagEmoji = getCountryFlagEmoji(iso2);

    return {
      iso2,
      dialCode,
      countryName,
      label: `${flagEmoji} ${countryName} +${dialCode}`.trim(),
    };
  });
};

const getInitialCountry = (storedPhoneNumber: string): string => {
  const parsedPhoneNumber = parsePhoneNumberFromString(storedPhoneNumber);
  const parsedCountry = parsedPhoneNumber?.country?.toLowerCase();

  if (parsedCountry && SUPPORTED_COUNTRY_ISO2.includes(parsedCountry)) {
    return parsedCountry;
  }

  return DEFAULT_COUNTRY_ISO2;
};

const getFormattedPhoneNumber = (
  formattedPhoneNumber: string,
  dialCode: string,
): string => {
  const trimmed = formattedPhoneNumber.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  return `+${dialCode} ${trimmed}`;
};

const getFormattedLocalPhoneNumber = (
  localPhoneNumber: string,
  countryIso2: string,
): string => {
  const digitsOnly = localPhoneNumber.replace(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }

  try {
    const formatter = new AsYouType(countryIso2.toUpperCase() as CountryCode);
    return formatter.input(digitsOnly) || digitsOnly;
  } catch {
    return digitsOnly;
  }
};

const isPhoneNumberValid = (
  localPhoneNumber: string,
  countryIso2: string,
  dialCode: string,
): boolean => {
  const digits = localPhoneNumber.replace(/\D/g, "");
  if (!digits || !countryIso2) {
    return false;
  }

  try {
    return isValidPhoneNumber(
      `+${dialCode}${digits}`,
      countryIso2.toUpperCase() as CountryCode,
    );
  } catch {
    return false;
  }
};

interface PageHeaderProps {
  language: string;
}

function PageHeader({ language }: PageHeaderProps) {
  const { t } = useTranslation("phone");
  return (
    <>
      <GcdsHeading tag="h1" lang={language}>
        {t("EnterNewPhoneNumber.title")}
      </GcdsHeading>
      <GcdsText>{t("EnterNewPhoneNumber.description")}</GcdsText>
      <ServicesWithAccessInfoSection
        currentLang={language}
        information={
          ServicesWithAccessInfoSectionInformation.CONTACT_PHONE_NUMBER
        }
      />
    </>
  );
}

function MyCountryIsNotListed() {
  const { t } = useTranslation("phone");
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={t("EnterNewPhoneNumber.countryNotListed")}>
        <GcdsText>
          <span>{t("EnterNewPhoneNumber.countryNotSupported")}</span>
        </GcdsText>
      </GcdsDetails>
    </GcdsText>
  );
}

type RadioOption = {
  label: string;
  id: ContactPhoneOtpType;
  value: ContactPhoneOtpType;
  hint: string;
  checked: boolean;
};

interface RadioButtonsProps {
  onChangePhoneForm: ContactPhoneStepProps["onChangePhoneForm"];
  phoneFormData: ContactPhoneStepProps["phoneFormData"];
  setErrorCode?: ContactPhoneStepProps["setErrorCode"];
}

function RadioButtons({
  onChangePhoneForm,
  phoneFormData,
  setErrorCode,
}: RadioButtonsProps) {
  const { t } = useTranslation("security");
  const radioOptions: RadioOption[] = [
    {
      label: t("OtpSelection.textMessage"),
      id: FLOW_TYPES.sms,
      value: FLOW_TYPES.sms,
      hint: t("OtpSelection.mobileOnly"),
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    },
    {
      label: t("OtpSelection.voiceCall"),
      id: FLOW_TYPES.voice,
      value: FLOW_TYPES.voice,
      hint: t("OtpSelection.mobileOrLandline"),
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    },
  ];

  return (
    <GcdsRadios
      name="radio"
      legend={t("OtpSelection.howToSendCode")}
      hint={t("OtpSelection.carrierCharges")}
      options={radioOptions}
      onGcdsChange={(event: Event) => {
        const target = event.target as HTMLInputElement;
        const selectedType = target.value as ContactPhoneOtpType;

        // Track OTP type selection
        trackButtonClick(`otp_type_${selectedType}`, {
          form_id: "contact_phone_number_update",
          selection_type: selectedType,
        });

        onChangePhoneForm("otpType", selectedType);
        setErrorCode?.("");
      }}
    />
  );
}

export default function EnterPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  errorMessage,
  setErrorCode,
}: ContactPhoneStepProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const { t } = useTranslation(["phone", "security", "common"]);
  const countryOptions = useMemo(
    () => createCountryOptions(language),
    [language],
  );
  const initialCountryIso2 = getInitialCountry(phoneFormData.phoneNumber);
  const initialDialCode = getDialCodeForCountry(initialCountryIso2);
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);
  const [selectedCountryIso2, setSelectedCountryIso2] =
    useState(initialCountryIso2);
  const selectedDialCode = useMemo(
    () => getDialCodeForCountry(selectedCountryIso2),
    [selectedCountryIso2],
  );
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const countryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const countrySearchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeCountryOptionIndex, setActiveCountryOptionIndex] = useState(-1);
  const [displayedPhoneNumber, setDisplayedPhoneNumber] = useState(() =>
    getDisplayedPhoneNumber(phoneFormData.phoneNumber, initialDialCode),
  );
  const selectedCountryOption = useMemo(
    () =>
      countryOptions.find((c) => c.iso2 === selectedCountryIso2) ??
      countryOptions[0],
    [countryOptions, selectedCountryIso2],
  );
  const filteredCountryOptions = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    if (!q) {
      return countryOptions;
    }
    return countryOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.countryName.toLowerCase().includes(q) ||
        o.iso2.includes(q) ||
        o.dialCode.includes(q),
    );
  }, [countryOptions, countrySearchQuery]);

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!phoneNumberValid || !phoneFormData.phoneNumber) {
      return;
    }
    await onNext();
  };

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  useEffect(() => {
    const nextDisplayed = getDisplayedPhoneNumber(
      phoneFormData.phoneNumber,
      selectedDialCode,
    );
    setDisplayedPhoneNumber(
      getFormattedLocalPhoneNumber(nextDisplayed, selectedCountryIso2),
    );
  }, [phoneFormData.phoneNumber, selectedCountryIso2, selectedDialCode]);

  const updatePhoneFields = (
    nextLocalPhoneNumber: string,
    nextCountryIso2: string,
    nextDialCode: string,
  ) => {
    const storedPhoneNumber = getStoredPhoneNumber(
      nextLocalPhoneNumber,
      nextDialCode,
    );
    setDisplayedPhoneNumber(
      getFormattedLocalPhoneNumber(nextLocalPhoneNumber, nextCountryIso2),
    );
    onChangePhoneForm("phoneNumber", storedPhoneNumber);
    onChangePhoneForm(
      "formattedPhoneNumber",
      storedPhoneNumber
        ? getFormattedPhoneNumber(nextLocalPhoneNumber, nextDialCode)
        : "",
    );
    setPhoneNumberValid(
      isPhoneNumberValid(nextLocalPhoneNumber, nextCountryIso2, nextDialCode),
    );
    setErrorCode?.("");
  };

  const onCountryOptionSelect = (nextCountryIso2: string) => {
    const nextDialCode = getDialCodeForCountry(nextCountryIso2);
    setSelectedCountryIso2(nextCountryIso2);
    updatePhoneFields(displayedPhoneNumber, nextCountryIso2, nextDialCode);
    setCountrySearchQuery("");
    setActiveCountryOptionIndex(-1);
    setIsCountryMenuOpen(false);
  };

  const focusActiveCountryOption = (nextIndex: number) => {
    const option = filteredCountryOptions[nextIndex];
    if (!option) {
      return;
    }
    (
      document.getElementById(
        `cp-country-option-${option.iso2}`,
      ) as HTMLElement | null
    )?.focus();
  };

  const openCountryMenu = (initialIndex = -1) => {
    setIsCountryMenuOpen(true);
    const selectedIndex = filteredCountryOptions.findIndex(
      (o) => o.iso2 === selectedCountryIso2,
    );
    setActiveCountryOptionIndex(
      initialIndex >= 0
        ? initialIndex
        : selectedIndex >= 0
          ? selectedIndex
          : filteredCountryOptions.length > 0
            ? 0
            : -1,
    );
  };

  const closeCountryMenu = () => {
    setIsCountryMenuOpen(false);
    setActiveCountryOptionIndex(-1);
  };

  const onCountryTriggerKeyDown: React.KeyboardEventHandler<
    HTMLButtonElement
  > = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openCountryMenu(0);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      isCountryMenuOpen ? closeCountryMenu() : openCountryMenu();
    }
  };

  const moveActiveCountryOption = (direction: "next" | "previous") => {
    const n = filteredCountryOptions.length;
    if (n === 0) {
      return;
    }
    const nextIndex =
      direction === "next"
        ? (activeCountryOptionIndex + 1) % n
        : (activeCountryOptionIndex - 1 + n) % n;
    setActiveCountryOptionIndex(nextIndex);
    focusActiveCountryOption(nextIndex);
  };

  const onCountrySearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveCountryOption(event.key === "ArrowDown" ? "next" : "previous");
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeCountryMenu();
      countryTriggerRef.current?.focus();
    }
  };

  const onCountryOptionKeyDown = (
    event: React.KeyboardEvent<HTMLLIElement>,
    countryIso2: string,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveCountryOption(event.key === "ArrowDown" ? "next" : "previous");
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onCountryOptionSelect(countryIso2);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeCountryMenu();
      countryTriggerRef.current?.focus();
    } else if (event.key === "Tab") {
      closeCountryMenu();
    }
  };

  const onPhoneInputChange = (event: CustomEvent<string>) => {
    const nextLocalPhoneNumber = (
      (event.target as HTMLInputElement).value ?? ""
    )
      .replace(/\D/g, "")
      .slice(0, MAX_PHONE_DIGITS);
    updatePhoneFields(
      nextLocalPhoneNumber,
      selectedCountryIso2,
      selectedDialCode,
    );
  };

  const restorePhoneCursor = (
    shadowInput: HTMLInputElement,
    digitsBeforeCursor: number,
  ) => {
    requestAnimationFrame(() => {
      const newValue = shadowInput.value;
      if (digitsBeforeCursor <= 0) {
        shadowInput.setSelectionRange(0, 0);
        return;
      }
      let digitCount = 0;
      let newCursorPos = newValue.length;
      for (let i = 0; i < newValue.length; i++) {
        if (/\d/.test(newValue[i])) {
          digitCount++;
          if (digitCount === digitsBeforeCursor) {
            newCursorPos = i + 1;
            break;
          }
        }
      }
      shadowInput.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const applyPhoneEdit = (
    shadowInput: HTMLInputElement,
    newDigits: string,
    digitsBeforeCursor: number,
  ) => {
    flushSync(() =>
      updatePhoneFields(newDigits, selectedCountryIso2, selectedDialCode),
    );
    restorePhoneCursor(shadowInput, digitsBeforeCursor);
  };

  const onPhoneInputKeyDown: React.KeyboardEventHandler<any> = (event) => {
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    const nativeEvent = event.nativeEvent as KeyboardEvent;
    const shadowInput = (nativeEvent.composedPath?.()[0] ??
      event.target) as HTMLInputElement;
    const value = shadowInput.value ?? "";
    const start = shadowInput.selectionStart ?? value.length;
    const end = shadowInput.selectionEnd ?? value.length;

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();

      if (start !== end) {
        const newDigits = (value.slice(0, start) + value.slice(end)).replace(
          /\D/g,
          "",
        );
        const cursorDigits = value.slice(0, start).replace(/\D/g, "").length;
        applyPhoneEdit(shadowInput, newDigits, cursorDigits);
      } else if (event.key === "Backspace") {
        let pos = start - 1;
        while (pos >= 0 && !/\d/.test(value[pos])) {
          pos--;
        }
        if (pos >= 0) {
          const newDigits = (
            value.slice(0, pos) + value.slice(pos + 1)
          ).replace(/\D/g, "");
          const cursorDigits = value.slice(0, pos).replace(/\D/g, "").length;
          applyPhoneEdit(shadowInput, newDigits, cursorDigits);
        }
      } else {
        let pos = start;
        while (pos < value.length && !/\d/.test(value[pos])) {
          pos++;
        }
        if (pos < value.length) {
          const newDigits = (
            value.slice(0, pos) + value.slice(pos + 1)
          ).replace(/\D/g, "");
          const cursorDigits = value.slice(0, pos).replace(/\D/g, "").length;
          applyPhoneEdit(shadowInput, newDigits, cursorDigits);
        }
      }

      return;
    }

    if (ALLOWED_PHONE_KEYS.has(event.key)) {
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      const beforeDigits = value.slice(0, start).replace(/\D/g, "");
      const afterDigits = value.slice(end).replace(/\D/g, "");
      const newDigits = (beforeDigits + event.key + afterDigits).slice(
        0,
        MAX_PHONE_DIGITS,
      );

      if (newDigits !== beforeDigits + afterDigits) {
        applyPhoneEdit(shadowInput, newDigits, beforeDigits.length + 1);
      }

      return;
    }

    event.preventDefault();
  };

  useEffect(() => {
    if (!isCountryMenuOpen) {
      return;
    }
    countrySearchInputRef.current?.focus();
    const onClickOutside = (event: MouseEvent) => {
      if (!countryDropdownRef.current?.contains(event.target as Node)) {
        closeCountryMenu();
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCountryMenu();
        countryTriggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isCountryMenuOpen]);

  useEffect(() => {
    if (!isCountryMenuOpen) {
      return;
    }
    if (filteredCountryOptions.length === 0) {
      setActiveCountryOptionIndex(-1);
      return;
    }
    if (
      activeCountryOptionIndex < 0 ||
      activeCountryOptionIndex >= filteredCountryOptions.length
    ) {
      const selectedIndex = filteredCountryOptions.findIndex(
        (o) => o.iso2 === selectedCountryIso2,
      );
      setActiveCountryOptionIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [
    activeCountryOptionIndex,
    filteredCountryOptions,
    isCountryMenuOpen,
    selectedCountryIso2,
  ]);

  useEffect(() => {
    if (
      countryOptions.length > 0 &&
      !countryOptions.some((o) => o.iso2 === selectedCountryIso2)
    ) {
      const fallback = countryOptions[0];
      setSelectedCountryIso2(fallback.iso2);
      updatePhoneFields(displayedPhoneNumber, fallback.iso2, fallback.dialCode);
    }
  }, [countryOptions, displayedPhoneNumber, selectedCountryIso2]);

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="500">
        <section>
          <PageHeader language={language} />
        </section>

        <form onSubmit={onSubmitHandler}>
          <section>
            {errorMessage ? (
              <GcdsErrorMessage messageId="message-props">
                {errorMessage}
              </GcdsErrorMessage>
            ) : null}
            <div className="mfa-phone-input mfa-phone-input--contact">
              <div
                className="mfa-phone-input__control-wrap"
                data-country-dial-code={`+${selectedDialCode}`}
              >
                <div className="mfa-phone-input__control-grid">
                  <div
                    className="mfa-phone-input__country-stack"
                    ref={countryDropdownRef}
                  >
                    <label
                      className="mfa-phone-input__country-label"
                      htmlFor="cp-country-dropdown-trigger"
                    >
                      {t("EnterNewPhoneNumber.countryLabel")}
                    </label>

                    <button
                      id="cp-country-dropdown-trigger"
                      ref={countryTriggerRef}
                      type="button"
                      className="mfa-phone-input__country-trigger"
                      aria-expanded={isCountryMenuOpen}
                      aria-haspopup="listbox"
                      aria-controls="cp-country-options"
                      aria-label={
                        selectedCountryOption
                          ? `${selectedCountryOption.countryName} +${selectedCountryOption.dialCode}`
                          : `+${selectedDialCode}`
                      }
                      onClick={() =>
                        isCountryMenuOpen
                          ? closeCountryMenu()
                          : openCountryMenu()
                      }
                      onKeyDown={onCountryTriggerKeyDown}
                    >
                      <span
                        aria-hidden="true"
                        className="mfa-phone-input__country-trigger-label"
                      >
                        {selectedCountryOption
                          ? `${getCountryFlagEmoji(selectedCountryOption.iso2)} +${selectedCountryOption.dialCode}`
                          : `+${selectedDialCode}`}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mfa-phone-input__country-trigger-arrow"
                      >
                        ▾
                      </span>
                    </button>

                    {isCountryMenuOpen && (
                      <div className="mfa-phone-input__country-panel">
                        <input
                          id="cp-country-search"
                          ref={countrySearchInputRef}
                          className="mfa-phone-input__country-search"
                          name="cp-country-search"
                          type="search"
                          role="combobox"
                          aria-expanded={true}
                          aria-haspopup="listbox"
                          aria-autocomplete="list"
                          placeholder={t(
                            "EnterNewPhoneNumber.countrySearchLabel",
                          )}
                          aria-label={t(
                            "EnterNewPhoneNumber.countrySearchLabel",
                          )}
                          aria-controls="cp-country-options"
                          aria-activedescendant={
                            activeCountryOptionIndex >= 0
                              ? `cp-country-option-${filteredCountryOptions[activeCountryOptionIndex]?.iso2}`
                              : undefined
                          }
                          value={countrySearchQuery}
                          onChange={(e) =>
                            setCountrySearchQuery(e.target.value ?? "")
                          }
                          onKeyDown={onCountrySearchKeyDown}
                        />

                        <ul
                          id="cp-country-options"
                          className="mfa-phone-input__country-options"
                          role="listbox"
                          aria-label={t("EnterNewPhoneNumber.countryLabel")}
                        >
                          {filteredCountryOptions.length > 0 ? (
                            filteredCountryOptions.map(
                              (countryOption, index) => (
                                <li
                                  key={countryOption.iso2}
                                  id={`cp-country-option-${countryOption.iso2}`}
                                  role="option"
                                  aria-selected={
                                    countryOption.iso2 === selectedCountryIso2
                                  }
                                  tabIndex={-1}
                                  className={`mfa-phone-input__country-option ${activeCountryOptionIndex === index ? "mfa-phone-input__country-option--active" : ""}`.trim()}
                                  onClick={() =>
                                    onCountryOptionSelect(countryOption.iso2)
                                  }
                                  onKeyDown={(event) =>
                                    onCountryOptionKeyDown(
                                      event,
                                      countryOption.iso2,
                                    )
                                  }
                                >
                                  <span aria-hidden="true">
                                    {getCountryFlagEmoji(countryOption.iso2)}
                                  </span>
                                  {` ${countryOption.countryName} +${countryOption.dialCode}`}
                                </li>
                              ),
                            )
                          ) : (
                            <li className="mfa-phone-input__country-empty">
                              {t("EnterNewPhoneNumber.countryNotSupported")}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <GcdsInput
                    inputId="cp-phone-number"
                    id="cp-phone-number"
                    label={t("EnterNewPhoneNumber.phoneLabel")}
                    name="phone"
                    value={displayedPhoneNumber}
                    onGcdsInput={onPhoneInputChange}
                    onKeyDown={onPhoneInputKeyDown}
                  />
                </div>
              </div>
            </div>
          </section>
        </form>

        <section>
          <MyCountryIsNotListed />
          <GcdsHeading tag="h3">
            {t("EnterNewPhoneNumber.verifyNumber")}
          </GcdsHeading>
          <GcdsText>{t("EnterNewPhoneNumber.verifyDescription")}</GcdsText>
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
            phoneFormData={phoneFormData}
            setErrorCode={setErrorCode}
          />
        </section>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          disabled={!phoneNumberValid || !phoneFormData.phoneNumber}
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitClick}
          currentLang={language}
        />

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            trackButtonClick("cancel_phone_update", {
              form_id: "contact_phone_number_update",
              step: "enter_phone",
            });
            void onCancel();
          }}
        >
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
