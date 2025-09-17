import { screen } from "@testing-library/react";
import { expect } from "vitest";
import "@testing-library/jest-dom";
import { AVAILABLE_LANGUAGES, FLOW_TYPES, SERVICES } from "../utils/constants";
import { getFooter } from "../utils/functions";
// @ts-ignore
import * as engJson from "../locales/en/en.json";
// @ts-ignore
import * as frJson from "../locales/fr/fr.json";
import { PAGES } from "../utils/constants.jsx";
import { page } from "@vitest/browser/context";

const subLinks = {
  attribute: "sub-links",
  en: getFooter(AVAILABLE_LANGUAGES.en),
  fr: getFooter(AVAILABLE_LANGUAGES.fr),
};
const GCDS_TAG_ATTRIBUTES = {
  "gcds-input": {
    attributes: ["input-id", "label", "name", "type", "validate-on"],
  },
  "gcds-input2": {
    attributes: ["input-id", "label", "name", "type", "hint"],
  },
  "gcds-input3": {
    attributes: ["input-id", "label", "name", "type"],
  },
  "gcds-fieldset": {
    attributes: ["fieldset-id", "hint", "legend"],
  },
  "gcds-fieldset2": {
    attributes: ["fieldset-id", "legend"],
  },
  "gcds-radio-group": {
    attributes: ["name", "options"],
  },
  "gcds-button": {
    attributes: ["type"],
  },
  "gcds-footer": {
    attributes: ["sub-links"],
  },
  "gcds-header": {
    attributes: ["lang", "lang-href", "signature-variant"],
  },
  "gcds-details": {
    attributes: ["details-title"],
  },
  "gcds-stepper": {
    attributes: ["current-step", "tag", "total-steps", "lang"],
  },
  "gcds-stepper2": {
    attributes: [
      "current-step",
      "tag",
      "total-steps",
      "lang",
      "margin-bottom",
      "margin-top",
    ],
  },
  "gcds-notice": {
    name: "gcds-notice",
    attributes: ["notice-title", "notice-title-tag", "type"],
  },
  "gcds-checkbox": {
    name: "gcds-checkbox",
    attributes: ["checkbox-id", "label", "name"],
  },
  "gcds-card": {
    attributes: ["card-title", "href", "card-title-tag"],
  },
  "gcds-grid": {
    attributes: [],
  },
};

interface TestParameters {
  language: string;
  pageContentJson: JSON;
  langLink: string;
  buttonJson: JSON;
  isVoice: boolean;
  stepper: Array<string>;
  textKeysToNotSearch: Array<string>;
  smsTextKeys: Array<string>;
  voiceTextKeys: Array<string>;
  serviceKey: string;
}

export const buildTestSuite = {
  test: (
    language: string,
    page: string,
    flow: string,
    type: string,
    link: string,
  ) => {
    testSuite.page(
      page,
      flow,
      testSuite.parameters(language, page, flow, type, link),
    );
  },
};

const pageSetup = {
  button: (page: string, language: string) => {
    switch (page) {
      case PAGES.manageDashboard:
        return null;
      case PAGES.securitySettings:
        return null;
      default:
        return language !== AVAILABLE_LANGUAGES.fr
          ? engJson["Button"]
          : frJson["Button"];
    }
  },
  stepper: (page: string, flow: string, type: string) => {
    switch (page) {
      case PAGES.verification:
        return null;
      default:
        return null;
    }
  },
  textKeysToNotSearch: (page: string, flow: string, type: string) => {
    switch (page) {
      case PAGES.password:
        return [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
        ];
      case PAGES.verification:
        return [
          "11",
          "12",
          "13",
          "15",
          "16",
          "17",
          "22",
          "23",
          "24",
          "25",
          "26",
        ];
      default:
        return [];
    }
  },

  smsTextKeys: (page: string) => {
    switch (page) {
      case PAGES.verification:
        return ["2", "4"];
      default:
        return [];
    }
  },
  voiceTextKeys: (page: string) => {
    switch (page) {
      case PAGES.verification:
        return ["3", "5"];
      default:
        return [];
    }
  },
  serviceKey: (page: string, flow: string) => {
    switch (page) {
      case PAGES.password:
        return "16";
      case PAGES.verification:
        return "20";
      default:
        return null;
    }
  },
  gcdsMap: (
    language: string,
    page: string,
    pageContentJson: JSON,
    flow: string,
  ) => {
    switch (page) {
      case PAGES.password:
        return pageSetup.passwordGcdsMap(flow, pageContentJson);
      case PAGES.verification:
        return pageSetup.verificationGcdsMap(pageContentJson);
      case PAGES.manageDashboard:
        return pageSetup.manageDashboardGcdsMap(pageContentJson);
      default:
        return new Map();
    }
  },
  passwordGcdsMap: (flow: string, pageContentJson: JSON) => {
    const gcdsElementMap = new Map();
    gcdsElementMap.set("9", [
      "gcds-input",
      createMap("gcds-input2", [
        "input-password",
        pageContentJson["9"],
        "password",
        "password",
        "",
      ]),
    ]);

    return gcdsElementMap;
  },
  verificationGcdsMap: (pageContentJson: JSON) => {
    const gcdsElementMap = new Map();
    gcdsElementMap.set("9", [
      "gcds-input",
      createMap("gcds-input", [
        "verificationCode",
        pageContentJson["9"],
        "verificationCode",
        "text",
        "other",
      ]),
    ]);

    return gcdsElementMap;
  },
  manageDashboardGcdsMap(pageContentJson: JSON) {
    const gcdsElementMap = new Map();
    gcdsElementMap.set("2", [
      "gcds-card",
      createMap("gcds-card", [pageContentJson["2"], "#", "h3"]),
    ]);
    gcdsElementMap.set("3", [
      "gcds-card",
      createMap("gcds-card", [pageContentJson["3"], "#", "h3"]),
    ]);
    return gcdsElementMap;
  },
  securitySettingsGcdsMap: (pageContentJson: JSON) => {
    const gcdsElementMap = new Map();

    return gcdsElementMap;
  },
};

const testSuite = {
  parameters: (
    language: string,
    page: string,
    flow: string,
    type: string,
    link: string,
  ) => {
    return {
      language: language,
      pageContentJson:
        language !== AVAILABLE_LANGUAGES.fr ? engJson[page] : frJson[page],
      langLink: link,
      buttonJson: pageSetup.button(page, language),
      stepper: pageSetup.stepper(page, flow, type),
      textKeysToNotSearch: pageSetup.textKeysToNotSearch(page, flow, type),
      isVoice: type === FLOW_TYPES.voice,
      smsTextKeys: pageSetup.smsTextKeys(page),
      voiceTextKeys: pageSetup.voiceTextKeys(page),
      serviceKey: pageSetup.serviceKey(page, flow),
    };
  },
  page: (
    page: string,
    flow: string,
    {
      language,
      pageContentJson,
      langLink,
      buttonJson,
      stepper,
      textKeysToNotSearch,
      isVoice,
      smsTextKeys,
      voiceTextKeys,
      serviceKey,
    }: TestParameters,
  ) => {
    verifyCommonElements(language, langLink, buttonJson, stepper);

    const gcdsElementMap = pageSetup.gcdsMap(
      language,
      page,
      pageContentJson,
      flow,
    );

    Object.keys(pageContentJson).forEach((key) => {
      if (gcdsElementMap.has(key))
        verifyGcdsHtmlElement(
          gcdsElementMap.get(key)[0],
          gcdsElementMap.get(key)[1],
        );
      else if (!textKeysToNotSearch.includes(key))
        if (key === serviceKey)
          if (language === AVAILABLE_LANGUAGES.fr)
            expect(
              screen.queryByText(
                pageContentJson[key] + " " + SERVICES[0].title,
              ),
            ).toBeInTheDocument();
          else
            expect(
              screen.queryByText(
                SERVICES[0].title + " " + pageContentJson[key],
              ),
            ).toBeInTheDocument();
        else if (
          (!smsTextKeys.includes(key) && !voiceTextKeys.includes(key)) ||
          (smsTextKeys.includes(key) && !isVoice) ||
          (voiceTextKeys.includes(key) && isVoice)
        ) {
          expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
        }
    });
  },
};

function verifyGcdsHtmlElement(tag: string, attributes: Map<string, string>) {
  const allElements = document.querySelectorAll(tag);
  let element = document.querySelector(tag) as HTMLElement;

  if (allElements !== null && allElements.length > 1) {
    allElements.forEach((el: HTMLElement) => {
      attributes.forEach((value) => {
        if (el.getAttribute(GCDS_TAG_ATTRIBUTES[tag].attributes[0]) === value)
          element = el;
      });
    });
  }

  expect(element).toBeTruthy();
  expect(element).toBeInTheDocument();

  attributes.forEach((value: string, attribute: string) => {
    expect(attribute).toBeTruthy();
    expect(element).toHaveAttribute(attribute, value);
  });
}

function createMap(type: string, values: Array<string>) {
  try {
    const map = new Map();
    const attributes = GCDS_TAG_ATTRIBUTES[type].attributes;
    attributes.forEach((attribute: string, key: string) => {
      map.set(attribute, values[key]);
    });
    return map;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function verifyCommonElements(
  language: string,
  langLink: string,
  buttonJson: JSON,
  stepper: Array<string>,
) {
  verifyGcdsHtmlElement(
    "gcds-header",
    createMap("gcds-header", [language, langLink, "colour"]),
  );

  if (stepper)
    verifyGcdsHtmlElement("gcds-stepper", createMap("gcds-stepper", stepper));
  if (buttonJson) {
    verifyGcdsHtmlElement("gcds-button", createMap("gcds-button", ["submit"]));
    expect(screen.queryByText(buttonJson["submit"])).toBeInTheDocument();
  }

  verifyGcdsHtmlElement(
    "gcds-footer",
    createMap("gcds-footer", [subLinks[language]]),
  );
}
