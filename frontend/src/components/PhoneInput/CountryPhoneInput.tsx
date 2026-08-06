import { GcdsInput } from "@gcds-core/components-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import "./CountryPhoneInput.css";
import { ALLOWED_PHONE_KEYS, MAX_PHONE_DIGITS } from "./constants";
import type { CountryPhoneInputProps } from "./types";
import {
  createCountryOptions,
  getCountryFlagEmoji,
  getDialCodeForCountry,
  getFormattedLocalPhoneNumber,
  getFormattedPhoneNumber,
  getInitialCountry,
  isPhoneNumberValidForCountry,
} from "./utils";
import {
  getDisplayedPhoneNumber,
  getStoredPhoneNumber,
} from "../../utils/mfaPhoneNumber";

function CountryPhoneInput({
  language,
  storedPhoneNumber,
  variant,
  optionIdPrefix,
  inputId,
  inputName = "phone",
  labels,
  onChange,
}: CountryPhoneInputProps) {
  const countryOptions = useMemo(
    () => createCountryOptions(language),
    [language],
  );
  const [selectedCountryIso2, setSelectedCountryIso2] = useState(() =>
    getInitialCountry(storedPhoneNumber),
  );
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
    getDisplayedPhoneNumber(
      storedPhoneNumber,
      getDialCodeForCountry(getInitialCountry(storedPhoneNumber)),
    ),
  );
  const selectedCountryOption = useMemo(
    () =>
      countryOptions.find((country) => country.iso2 === selectedCountryIso2) ??
      countryOptions[0],
    [countryOptions, selectedCountryIso2],
  );
  const filteredCountryOptions = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    if (!q) {
      return countryOptions;
    }
    return countryOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(q) ||
        option.countryName.toLowerCase().includes(q) ||
        option.iso2.includes(q) ||
        option.dialCode.includes(q),
    );
  }, [countryOptions, countrySearchQuery]);

  const triggerId = `${optionIdPrefix}-country-dropdown-trigger`;
  const searchId = `${optionIdPrefix}-country-search`;
  const optionsId = `${optionIdPrefix}-country-options`;

  const emitChange = useCallback(
    (
      nextLocalPhoneNumber: string,
      nextCountryIso2: string,
      nextDialCode: string,
    ) => {
      const nextStoredPhoneNumber = getStoredPhoneNumber(
        nextLocalPhoneNumber,
        nextDialCode,
      );
      const nextFormattedPhoneNumber = nextStoredPhoneNumber
        ? getFormattedPhoneNumber(nextLocalPhoneNumber, nextDialCode)
        : "";

      onChange({
        storedPhoneNumber: nextStoredPhoneNumber,
        formattedPhoneNumber: nextFormattedPhoneNumber,
        isValid: isPhoneNumberValidForCountry(
          nextLocalPhoneNumber,
          nextCountryIso2,
          nextDialCode,
        ),
      });
    },
    [onChange],
  );

  const updatePhoneFields = useCallback(
    (
      nextLocalPhoneNumber: string,
      nextCountryIso2: string,
      nextDialCode: string,
    ) => {
      setDisplayedPhoneNumber(
        getFormattedLocalPhoneNumber(nextLocalPhoneNumber, nextCountryIso2),
      );
      emitChange(nextLocalPhoneNumber, nextCountryIso2, nextDialCode);
    },
    [emitChange],
  );

  const onCountryOptionSelect = useCallback(
    (nextCountryIso2: string) => {
      const nextDialCode = getDialCodeForCountry(nextCountryIso2);
      setSelectedCountryIso2(nextCountryIso2);
      updatePhoneFields(displayedPhoneNumber, nextCountryIso2, nextDialCode);
      setCountrySearchQuery("");
      setActiveCountryOptionIndex(-1);
      setIsCountryMenuOpen(false);
    },
    [displayedPhoneNumber, updatePhoneFields],
  );

  const focusActiveCountryOption = useCallback(
    (nextIndex: number) => {
      const option = filteredCountryOptions[nextIndex];
      if (!option) {
        return;
      }

      const optionEl = document.getElementById(
        `${optionIdPrefix}-country-option-${option.iso2}`,
      ) as HTMLElement | null;
      optionEl?.focus();
    },
    [filteredCountryOptions, optionIdPrefix],
  );

  const openCountryMenu = useCallback(
    (initialIndex = -1) => {
      setIsCountryMenuOpen(true);
      const selectedIndex = filteredCountryOptions.findIndex(
        (option) => option.iso2 === selectedCountryIso2,
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
    },
    [filteredCountryOptions, selectedCountryIso2],
  );

  const closeCountryMenu = useCallback(() => {
    setIsCountryMenuOpen(false);
    setActiveCountryOptionIndex(-1);
  }, []);

  const onCountryTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> =
    useCallback(
      (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openCountryMenu(0);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          isCountryMenuOpen ? closeCountryMenu() : openCountryMenu();
        }
      },
      [closeCountryMenu, isCountryMenuOpen, openCountryMenu],
    );

  const moveActiveCountryOption = useCallback(
    (direction: "next" | "previous") => {
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
    },
    [
      activeCountryOptionIndex,
      filteredCountryOptions.length,
      focusActiveCountryOption,
    ],
  );

  const onCountrySearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> =
    useCallback(
      (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          moveActiveCountryOption(
            event.key === "ArrowDown" ? "next" : "previous",
          );
        } else if (event.key === "Escape") {
          event.preventDefault();
          closeCountryMenu();
          countryTriggerRef.current?.focus();
        }
      },
      [closeCountryMenu, moveActiveCountryOption],
    );

  const onCountryOptionKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLLIElement>, countryIso2: string) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveActiveCountryOption(
          event.key === "ArrowDown" ? "next" : "previous",
        );
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
    },
    [closeCountryMenu, moveActiveCountryOption, onCountryOptionSelect],
  );

  const onPhoneInputChange = useCallback(
    (event: CustomEvent<string>) => {
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
    },
    [selectedCountryIso2, selectedDialCode, updatePhoneFields],
  );

  const restorePhoneCursor = useCallback(
    (shadowInput: HTMLInputElement, digitsBeforeCursor: number) => {
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
    },
    [],
  );

  const applyPhoneEdit = useCallback(
    (
      shadowInput: HTMLInputElement,
      newDigits: string,
      digitsBeforeCursor: number,
    ) => {
      flushSync(() => {
        updatePhoneFields(newDigits, selectedCountryIso2, selectedDialCode);
      });
      restorePhoneCursor(shadowInput, digitsBeforeCursor);
    },
    [
      restorePhoneCursor,
      selectedCountryIso2,
      selectedDialCode,
      updatePhoneFields,
    ],
  );

  const onPhoneInputKeyDown: React.KeyboardEventHandler<any> = useCallback(
    (event) => {
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
    },
    [applyPhoneEdit],
  );

  useEffect(() => {
    const nextDisplayed = getDisplayedPhoneNumber(
      storedPhoneNumber,
      selectedDialCode,
    );
    const nextFormattedLocalPhoneNumber = getFormattedLocalPhoneNumber(
      nextDisplayed,
      selectedCountryIso2,
    );
    setDisplayedPhoneNumber((currentDisplayedPhoneNumber) =>
      currentDisplayedPhoneNumber === nextFormattedLocalPhoneNumber
        ? currentDisplayedPhoneNumber
        : nextFormattedLocalPhoneNumber,
    );
  }, [storedPhoneNumber, selectedCountryIso2, selectedDialCode]);

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
  }, [closeCountryMenu, isCountryMenuOpen]);

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
  }, [
    countryOptions,
    displayedPhoneNumber,
    selectedCountryIso2,
    updatePhoneFields,
  ]);

  return (
    <div className={`mfa-phone-input mfa-phone-input--${variant}`}>
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
              htmlFor={triggerId}
            >
              {labels.country}
            </label>

            <button
              id={triggerId}
              ref={countryTriggerRef}
              type="button"
              className="mfa-phone-input__country-trigger"
              aria-expanded={isCountryMenuOpen}
              aria-haspopup="listbox"
              aria-controls={optionsId}
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
                  id={searchId}
                  ref={countrySearchInputRef}
                  className="mfa-phone-input__country-search"
                  name={searchId}
                  type="search"
                  role="combobox"
                  aria-expanded={true}
                  aria-haspopup="listbox"
                  aria-autocomplete="list"
                  placeholder={labels.countrySearch}
                  aria-label={labels.countrySearch}
                  aria-controls={optionsId}
                  aria-activedescendant={
                    activeCountryOptionIndex >= 0
                      ? `${optionIdPrefix}-country-option-${filteredCountryOptions[activeCountryOptionIndex]?.iso2}`
                      : undefined
                  }
                  value={countrySearchQuery}
                  onChange={(event) =>
                    setCountrySearchQuery(event.target.value ?? "")
                  }
                  onKeyDown={onCountrySearchKeyDown}
                />

                <ul
                  id={optionsId}
                  className="mfa-phone-input__country-options"
                  role="listbox"
                  aria-label={labels.country}
                >
                  {filteredCountryOptions.length > 0 ? (
                    filteredCountryOptions.map((countryOption, index) => (
                      <li
                        key={countryOption.iso2}
                        id={`${optionIdPrefix}-country-option-${countryOption.iso2}`}
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
                          onCountryOptionKeyDown(event, countryOption.iso2)
                        }
                      >
                        <span aria-hidden="true">
                          {getCountryFlagEmoji(countryOption.iso2)}
                        </span>
                        {` ${countryOption.countryName} +${countryOption.dialCode}`}
                      </li>
                    ))
                  ) : (
                    <li className="mfa-phone-input__country-empty">
                      {labels.countryNotSupported}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <GcdsInput
            inputId={inputId}
            id={inputId}
            label={labels.phone}
            name={inputName}
            value={displayedPhoneNumber}
            onGcdsInput={onPhoneInputChange}
            onKeyDown={onPhoneInputKeyDown}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(CountryPhoneInput);
