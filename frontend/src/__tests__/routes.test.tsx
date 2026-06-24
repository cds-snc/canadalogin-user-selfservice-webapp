import type { ReactElement } from "react";
import type { RouteObject } from "react-router";
import { describe, expect, it, vi } from "vitest";

const { mockComponent } = vi.hoisted(() => ({
  mockComponent: vi.fn(() => null),
}));

vi.mock("../utils/constants", async () => {
  const actual = await vi.importActual<typeof import("../utils/constants")>(
    "../utils/constants",
  );

  return {
    ...actual,
    DEV_ONLY_FEATURE: true,
  };
});

vi.mock("../components/Layout/RootLayout", () => ({
  default: mockComponent,
}));
vi.mock("../components/Providers/AppLanguageSetup", () => ({
  AppLanguageSetup: mockComponent,
}));
vi.mock("../components/Providers/LanguageProvider", () => ({
  LanguageProvider: mockComponent,
}));
vi.mock("../components/Providers/PrivateRoute", () => ({
  PrivateRoute: mockComponent,
}));
vi.mock("../components/Providers/UserProvider", () => ({
  UserProvider: mockComponent,
}));
vi.mock("../components/Manage/ManageDashboard", () => ({
  default: mockComponent,
}));
vi.mock("../components/Manage/ProfileHome", () => ({
  default: mockComponent,
}));
vi.mock("../components/Manage/SecuritySettings/Manage2FAVerifications", () => ({
  default: mockComponent,
}));
vi.mock("../components/Manage/SecuritySettings/SecuritySettings", () => ({
  default: mockComponent,
}));
vi.mock("../features/LanguagePreference/components/EditLanguagePreferencePage", () => ({
  default: mockComponent,
}));
vi.mock("../features/ProfileName/components/EditProfileNamePage", () => ({
  default: mockComponent,
}));
vi.mock("../features/ChangePassword/components/ChangePasswordIndex", () => ({
  default: mockComponent,
}));
vi.mock("../features/ContactPhoneNumber/components/EditContactPhoneNumberPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/EmailAddress/EditEmailAddressPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/ManageFIDO2/components/AddFIDO2Passkey/AddFIDO2PasskeyPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/ManageFIDO2/components/DeleteFIDO2Passkey/DeleteFIDO2PasskeyPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/IDV/InPerson/ServiceCanadaCentrePage", () => ({
  default: mockComponent,
}));
vi.mock("../features/IDV/InPerson/ServiceCanadaCentreIDVCodePage", () => ({
  default: mockComponent,
}));
vi.mock("../features/IDV/StartIdentityProofingPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/IDV/Online/ProvincialVerificationPage", () => ({
  default: mockComponent,
}));
vi.mock("../features/IDV/Online/OnlineVerificationInfo", () => ({
  default: mockComponent,
}));

import { appRoutes } from "../routes";
import { PAGES } from "../utils/constants";

function findRouteByPath(
  routes: RouteObject[],
  path: string,
): RouteObject | undefined {
  for (const route of routes) {
    if (route.path === path) {
      return route;
    }

    if (route.children) {
      const nestedRoute: RouteObject | undefined = findRouteByPath(
        route.children,
        path,
      );

      if (nestedRoute) {
        return nestedRoute;
      }
    }
  }

  return undefined;
}

describe("appRoutes", () => {
  it("adds the dev-only identity proofing success route", () => {
    const successRoute = findRouteByPath(appRoutes, "idv/success");
    const successElement = successRoute?.element as
      | ReactElement<{ showIDVSuccessNotice?: boolean }>
      | undefined;

    expect(successRoute).toBeDefined();
    expect(successRoute?.handle).toEqual({ id: PAGES.idvSuccessPage });
    expect(successElement?.type).toBe(mockComponent);
    expect(successElement?.props).toMatchObject({
      showIDVSuccessNotice: true,
    });
  });
});
