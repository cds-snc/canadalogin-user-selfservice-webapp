import { expect, userEvent, within } from "@storybook/test";
import { reactRouterParameters } from "storybook-addon-remix-react-router";
import { http, HttpResponse } from "msw";
import config from "../../../config.jsx";
import {
  ACTION_TYPES,
  TEST_TYPES,
  TestDataUserProvider,
} from "./constants.jsx";
import PageRenderer from "./PageRenderer.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
import React from "react";

const stepErrorMessage = "Verify error message is on Page.";
const stepSuccessMessage = "Verify success message is on Page.";
const stepNavigateMessage = "Verify page was navigated properly.";

interface TestCase {
  canvasElement: any;
  step: any;
  stepMessage: string;
  message: string;
  linkText: string;
  link: string;
  heading: string;
  delay: number;
  type: string;
  actionType: string;
  input: Input;
}

interface Input {
  inputType: string;
  stepMessage: string;
  value: string;
}

interface PathParams {
  language: string;
  flow: string;
  type: string;
}

interface Data {
  pwdMinLength: number;
  pwdMaxLength: number;
}

interface Response {
  success: boolean;
  message: string;
  data: Data;
  status?: number;
}

interface MSW {
  type: string;
  endpoint: string;
  response: Response;
}

export async function testCase({
  canvasElement,
  step,
  stepMessage,
  message,
  linkText,
  link,
  heading,
  delay,
  type,
  actionType,
  input,
}: TestCase) {
  const canvas = await testItem.canvas(canvasElement, delay);

  if (input !== undefined)
    switch (input.inputType) {
      case "textBox":
        await testItem.typeInInput(canvas, step, input);
        break;
    }

  switch (actionType) {
    case ACTION_TYPES.link:
      await testItem.clickLink(canvas, step, stepMessage, linkText);
      break;
    case ACTION_TYPES.submit:
      await testItem.clickButton(canvas, step);
      break;
    default:
      await expect(false).toBeTruthy();
      break;
  }

  switch (type) {
    case TEST_TYPES.error:
      await testItem.checkErrorMsg(
        canvas,
        step,
        stepErrorMessage,
        link,
        message,
        heading,
      );
      break;
    case TEST_TYPES.success:
      await testItem.checkAttribute(
        canvas,
        step,
        stepSuccessMessage,
        message,
        "notice-title",
        "linkSuccess",
      );
      break;
    case TEST_TYPES.redirect:
      //need to investigate further
      await testItem.queryPageText(
        canvas,
        step,
        stepNavigateMessage,
        "404 Not Found",
      );
      break;
    default:
      await expect(false).toBeTruthy();
      break;
  }
}

const testItem = {
  canvas: async (canvasElement: any, timeToWait: number) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, timeToWait));
    return canvas;
  },
  typeInInput: async (canvas: any, step: any, input: Input) => {
    await step(input.stepMessage, async () => {
      const placeholder = canvas.queryByRole("textbox");
      await userEvent.type(placeholder, input.value);
      await userEvent.tab();
    });
    await new Promise((r) => setTimeout(r, 1000));
  },
  clickButton: async (canvas: any, step: any) => {
    await step("Click button", async () => {
      await userEvent.click(canvas.queryByRole("button", { name: /test/i }));
    });
    await new Promise((r) => setTimeout(r, 1000));
  },
  queryPageText: async (
    canvas: any,
    step: any,
    message: string,
    text: string,
  ) => {
    await step(message, async () => {
      await expect(canvas.queryByText(text)).toBeInTheDocument();
    });
  },
  clickLink: async (
    canvas: any,
    step: any,
    stepMessage: string,
    linkText: string,
  ) => {
    await step(stepMessage, async () => {
      const link = canvas.queryByText(linkText);
      await expect(link).toBeInTheDocument();
      await userEvent.click(link);
    });
    await new Promise((r) => setTimeout(r, 1000));
  },
  checkErrorMsg: async (
    canvas: any,
    step: any,
    stepMessage: string,
    link: string,
    message: string,
    heading: string,
  ) => {
    await step(stepMessage, async () => {
      const errorSummary = await canvas.queryByTestId("errorSummary");
      await expect(errorSummary).toBeInTheDocument();
      await expect(errorSummary.getAttribute("error-links")).toEqual(
        '{"#' + link + '": "' + message + '"}',
      );
      await expect(errorSummary.getAttribute("heading")).toEqual(heading);
    });
  },
  checkAttribute: async (
    canvas: any,
    step: any,
    stepMessage: string,
    message: string,
    attribute: string,
    testId: string,
  ) => {
    await step(stepMessage, async () => {
      const linkSuccess = await canvas.queryByTestId(testId);
      await expect(linkSuccess).toBeInTheDocument();
      await expect(linkSuccess).toHaveAttribute(attribute, message);
    });
  },
};

export const buildTestCase = {
  parameters: (
    navigationLink: string,
    pathParams: PathParams,
    mswArray: Array<MSW>,
  ) => {
    const routingPath = buildPath(pathParams, navigationLink);
    const reactRoutingParameters = buildRoutingParams(pathParams, routingPath);
    const mswResponse = buildMswMapping(mswArray);

    return {
      ...reactRoutingParameters,
      ...mswResponse,
    };
  },
};

function buildPath(pathParams: PathParams, navigationLink: string) {
  if (pathParams.type !== undefined)
    return { path: "/:language" + navigationLink + "/:type" };

  return { path: "/:language" + navigationLink };
}

function buildRoutingParams(
  pathParams: PathParams,
  routingPath: { path: string },
) {
  return {
    reactRouter: reactRouterParameters({
      location: {
        pathParams: { ...pathParams },
      },
      routing: routingPath,
    }),
  };
}

function buildMswMapping(mswArray: Array<MSW>) {
  let handlers: any[] = [];

  // Add default handlers for EventSource endpoints that are always needed
  handlers.push(
    // Mock the session-status EventSource endpoint
    http.get(`${config.apiUrl}/v1/auth/session-status`, async () => {
      // Return a simple response for EventSource connection attempts
      return new HttpResponse(
        'event: notification\ndata: {"status":"active","data":"session active"}\n\n',
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        },
      );
    }),

    // Mock the user profile endpoint that UserProvider calls
    http.get(`${config.apiUrl}/v1/users/profile`, async () => {
      return HttpResponse.json({
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
      });
    }),
  );

  if (mswArray != null)
    Object.keys(mswArray).forEach((key) => {
      const msw = mswArray[parseInt(key)];
      if (msw.type === "get")
        handlers.push(
          http.get(`${config.apiUrl}${msw.endpoint}`, async () => {
            return HttpResponse.json(msw.response);
          }),
        );
      else if (msw.type === "post")
        if (msw.response?.status)
          handlers.push(
            http.post(`${config.apiUrl}${msw.endpoint}`, async () => {
              return HttpResponse.json(msw.response.data, {
                status: msw.response.status,
              });
            }),
          );
        else
          handlers.push(
            http.post(`${config.apiUrl}${msw.endpoint}`, async () => {
              return HttpResponse.json(msw.response);
            }),
          );
    });

  return {
    msw: {
      handlers: handlers,
    },
  };
}

export const Template = (args: any) => {
  const testData = {
    ...TestDataUserProvider,
    loadingText: null,
  };
  testData.userData.phone = args.phone;
  testData.userData.otpType = args.otpType;
  return (
    <UserProvider initial={testData}>
      <LanguageProvider>
        <PageRenderer page={args.page} />
      </LanguageProvider>
    </UserProvider>
  );
};

export const TestTemplate = (args: any) => {
  const testData = {
    ...TestDataUserProvider,
    loadingText: null,
  };
  testData.userData.email = args.email;
  testData.userData.phone = args.phone;
  testData.userData.id = args.id;
  testData.userData.otpType = args.otpType;
  testData.userData.passwordValidated = args.passwordValidated;

  testData.testData.otp = args.otp;
  testData.testData.firstname = args.firstName; // Use 'firstname' as defined in constants
  testData.testData.lastName = args.lastName;
  testData.testData.password = args.password;
  testData.testData.email = args.email;

  return (
    <UserProvider initial={testData}>
      <LanguageProvider>
        <PageRenderer
          page={args.page}
          phoneFormData={args.phoneFormData}
          onNext={args.onNext}
          onCancel={args.onCancel}
        />
        <button aria-label="test" type="submit" form="form"></button>
      </LanguageProvider>
    </UserProvider>
  );
};
