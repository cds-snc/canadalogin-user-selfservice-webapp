import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsLink,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";
import {
  AsYouType,
  isValidPhoneNumber,
  CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useParams } from "react-router";
import {
  countryMapping,
  EXTERNAL_NAVIGATION_LINKS,
  FLOW_TYPES,
  PAGES,
} from "../../../../utils/constants";
import {
  ALLOWED_PHONE_KEYS,
  COUNTRY_NAME_OVERRIDES,
  DEFAULT_COUNTRY_ISO2,
  MAX_PHONE_DIGITS,
  SUPPORTED_COUNTRY_ISO2,
} from "../constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../../utils/routeHelpers";
import SubmitButton from "../../../../components/Layout/SubmitButton";
import {
  getDisplayedPhoneNumber,
  getStoredPhoneNumber,
} from "../../../../utils/mfaPhoneNumber";

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
) => {
  const trimmedFormattedPhoneNumber = formattedPhoneNumber.trim();

  if (!trimmedFormattedPhoneNumber) {
    return "";
  }

  if (trimmedFormattedPhoneNumber.startsWith("+")) {
    return trimmedFormattedPhoneNumber;
  }

  return `+${dialCode} ${trimmedFormattedPhoneNumber}`;
};

const getFormattedLocalPhoneNumber = (
  localPhoneNumber: string,
  countryIso2: string,
) => {
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

interface PhoneFormData {
  phoneNumber: string;
  otp: string;
  mfaId: string;
  trxnId: string;
  otpType: string;
  formattedPhoneNumber: string;
}

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

interface RadioButtonsProps {
  onChangePhoneForm: (field: string, value: string) => void;
  phoneFormData: PhoneFormData;
}

const RadioButtons = ({
  onChangePhoneForm,
  phoneFormData,
}: RadioButtonsProps) => {
  const { t } = useTranslation("mfa");
  const radioOptions: RadioOption[] = [
    {
      label: t("AddMFANumber.textMessage"),
      id: `sms-radio-${FLOW_TYPES.sms}`,
      value: FLOW_TYPES.sms,
      hint: t("AddMFANumber.textMessageHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.sms,
    },
    {
      label: t("AddMFANumber.voiceCall"),
      id: `voice-radio-${FLOW_TYPES.voice}`,
      value: FLOW_TYPES.voice,
      hint: t("AddMFANumber.voiceCallHint"),
      checked: phoneFormData.otpType === FLOW_TYPES.voice,
    },
  ];

  return (
    <GcdsRadios
      name="radio"
      legend={t("AddMFANumber.howToSendCode")}
      hint={t("AddMFANumber.changeNextSignIn")}
      options={radioOptions}
      required={true}
      onGcdsChange={(e: CustomEvent<string>) => {
        onChangePhoneForm("otpType", (e.target as HTMLInputElement).value);
      }}
    ></GcdsRadios>
  );
};

const MyCountryIsNotListed = () => {
  const { t } = useTranslation("mfa");
  return (
    <GcdsText>
      <GcdsDetails detailsTitle={t("AddMFANumber.countryNotListed")}>
        <GcdsText>
          <span>{t("AddMFANumber.countryNotSupported")}</span>
        </GcdsText>
      </GcdsDetails>
    </GcdsText>
  );
};

interface AddMFAPhoneNumberProps {
  onNext: () => Promise<void>;
  onCancel: () => Promise<void>;
  onChangePhoneForm: (field: string, value: string) => void;
  phoneFormData: PhoneFormData;
  setErrorCode: (code: string) => void;
  errorMessage: string;
}

export default function AddMFAPhoneNumber({
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  setErrorCode,
  errorMessage,
}: AddMFAPhoneNumberProps) {
  const { language } = useParams();
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
  const selectedCountryOption = useMemo(() => {
    return (
      countryOptions.find((country) => country.iso2 === selectedCountryIso2) ??
      countryOptions[0]
    );
  }, [countryOptions, selectedCountryIso2]);
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
  const { t } = useTranslation(["mfa", "common"]);
  const backtoProfilePage = path(PAGES.ProfileHome, { language: language });
  const privacyNoticeHref =
    language === "fr"
      ? `${EXTERNAL_NAVIGATION_LINKS.CanadaLoginWebsiteProdDomainFR}/utilisateurs/confidentialite/`
      : `${EXTERNAL_NAVIGATION_LINKS.CanadaLoginWebsiteProdDomainEN}/users/privacy/`;

  const doSubmit = async () => {
    try {
      setErrorCode("");
      await onNext();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      if (err?.data?.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    if (!phoneNumberValid || !phoneFormData.phoneNumber) {
      return;
    }
    void doSubmit();
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
    setErrorCode("");
  };

  const onCountrySearchChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setCountrySearchQuery(event.target.value ?? "");
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

    const optionEl = document.getElementById(
      `mfa-country-option-${option.iso2}`,
    ) as HTMLElement | null;
    optionEl?.focus();
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
    flushSync(() => {
      updatePhoneFields(newDigits, selectedCountryIso2, selectedDialCode);
    });
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
        applyPhoneEdit(
          shadowInput,
          (value.slice(0, start) + value.slice(end)).replace(/\D/g, ""),
          value.slice(0, start).replace(/\D/g, "").length,
        );
      } else if (event.key === "Backspace") {
        let pos = start - 1;
        while (pos >= 0 && !/\d/.test(value[pos])) {
          pos--;
        }
        if (pos >= 0) {
          applyPhoneEdit(
            shadowInput,
            (value.slice(0, pos) + value.slice(pos + 1)).replace(/\D/g, ""),
            value.slice(0, pos).replace(/\D/g, "").length,
          );
        }
      } else {
        let pos = start;
        while (pos < value.length && !/\d/.test(value[pos])) {
          pos++;
        }
        if (pos < value.length) {
          applyPhoneEdit(
            shadowInput,
            (value.slice(0, pos) + value.slice(pos + 1)).replace(/\D/g, ""),
            value.slice(0, pos).replace(/\D/g, "").length,
          );
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
      const target = event.target as Node;
      if (!countryDropdownRef.current?.contains(target)) {
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
        (option) => option.iso2 === selectedCountryIso2,
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
      !countryOptions.some((option) => option.iso2 === selectedCountryIso2)
    ) {
      const fallbackCountry = countryOptions[0];
      setSelectedCountryIso2(fallbackCountry.iso2);
      updatePhoneFields(
        displayedPhoneNumber,
        fallbackCountry.iso2,
        fallbackCountry.dialCode,
      );
    }
  }, [countryOptions, displayedPhoneNumber, selectedCountryIso2]);

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="500">
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {t("AddMFANumber.title")}
          </GcdsHeading>
          <GcdsText>{t("AddMFANumber.description")}</GcdsText>
          <GcdsText>
            {t("AddMFANumber.onlyFor2Step")}{" "}
            <GcdsLink href={backtoProfilePage}>
              {t("AddMFANumber.personalInformation")}
            </GcdsLink>{" "}
            {t("AddMFANumber.period")}
          </GcdsText>
          <GcdsText>
            {t("AddMFANumber.privacyNoticeLead")}{" "}
            <GcdsLink href={privacyNoticeHref}>
              {t("AddMFANumber.privacyNoticeLink")}
            </GcdsLink>{" "}
            {t("AddMFANumber.privacyNoticeSuffix")}
          </GcdsText>
        </GcdsContainer>

        <section>
          {errorMessage && (
            <GcdsErrorMessage messageId="message-props">
              {errorMessage}
            </GcdsErrorMessage>
          )}
          <form onSubmit={onSubmitHandler}>
            <div className="mfa-phone-input mfa-phone-input--mfa">
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
                      htmlFor="mfa-country-dropdown-trigger"
                    >
                      {t("AddMFANumber.countryLabel")}
                    </label>

                    <button
                      id="mfa-country-dropdown-trigger"
                      ref={countryTriggerRef}
                      type="button"
                      className="mfa-phone-input__country-trigger"
                      aria-expanded={isCountryMenuOpen}
                      aria-haspopup="listbox"
                      aria-controls="mfa-country-options"
                      aria-label={
                        selectedCountryOption
                          ? `${selectedCountryOption.countryName} +${selectedCountryOption.dialCode}`
                          : `+${selectedDialCode}`
                      }
                      onClick={() => {
                        if (isCountryMenuOpen) {
                          closeCountryMenu();
                        } else {
                          openCountryMenu();
                        }
                      }}
                      onKeyDown={onCountryTriggerKeyDown}
                    >
                      {/* aria-hidden prevents flag emoji and dial code from being read twice */}
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
                          id="mfa-country-search"
                          ref={countrySearchInputRef}
                          className="mfa-phone-input__country-search"
                          name="mfa-country-search"
                          type="search"
                          role="combobox"
                          aria-expanded={true}
                          aria-haspopup="listbox"
                          aria-autocomplete="list"
                          placeholder={t("AddMFANumber.countrySearchLabel")}
                          aria-label={t("AddMFANumber.countrySearchLabel")}
                          aria-controls="mfa-country-options"
                          aria-activedescendant={
                            activeCountryOptionIndex >= 0
                              ? `mfa-country-option-${filteredCountryOptions[activeCountryOptionIndex]?.iso2}`
                              : undefined
                          }
                          value={countrySearchQuery}
                          onChange={onCountrySearchChange}
                          onKeyDown={onCountrySearchKeyDown}
                        />

                        <ul
                          id="mfa-country-options"
                          className="mfa-phone-input__country-options"
                          role="listbox"
                          aria-label={t("AddMFANumber.countryLabel")}
                        >
                          {filteredCountryOptions.length > 0 ? (
                            filteredCountryOptions.map(
                              (countryOption, index) => (
                                <li
                                  key={countryOption.iso2}
                                  id={`mfa-country-option-${countryOption.iso2}`}
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
                              {t("AddMFANumber.countryNotSupported")}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <GcdsInput
                    inputId="mfa-phone-number"
                    id="mfa-phone-number"
                    label={t("AddMFANumber.phoneLabel")}
                    name="phone"
                    value={displayedPhoneNumber}
                    onGcdsInput={onPhoneInputChange}
                    onKeyDown={onPhoneInputKeyDown}
                  />
                </div>
              </div>
            </div>
          </form>
        </section>

        <section>
          <MyCountryIsNotListed />
          <RadioButtons
            onChangePhoneForm={onChangePhoneForm}
            phoneFormData={phoneFormData}
          />
        </section>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          disabled={!phoneNumberValid || !phoneFormData.phoneNumber}
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            void doSubmit();
          }}
          currentLang={language ?? "en"}
        ></SubmitButton>

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
          }}
        >
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
