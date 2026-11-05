import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import UserContext from "../../components/Providers/UserContext";
import type { UserContextValue } from "../../types/user";
import { useIdvFeatureAccess } from "../useIdvFeatureAccess";

const configMock = vi.hoisted(() => ({ environment: "prod" }));

vi.mock("../../config", () => ({ default: configMock }));

function FeatureAccessStatus() {
  return <span>{useIdvFeatureAccess() ? "allowed" : "denied"}</span>;
}

function renderWithIdvAccess(idvAccess: boolean) {
  const contextValue = {
    state: { features: { idv: idvAccess } },
    dispatch: vi.fn(),
  } as unknown as UserContextValue;

  return render(
    <UserContext.Provider value={contextValue}>
      <FeatureAccessStatus />
    </UserContext.Provider>,
  );
}

describe("useIdvFeatureAccess", () => {
  beforeEach(() => {
    configMock.environment = "prod";
  });

  it.each(["local", "dev"])(
    "allows all users in the %s environment",
    (environment) => {
      configMock.environment = environment;

      renderWithIdvAccess(false);

      expect(screen.getByText("allowed")).toBeTruthy();
    },
  );

  it("allows a group-authorized user outside local and dev", () => {
    renderWithIdvAccess(true);

    expect(screen.getByText("allowed")).toBeTruthy();
  });

  it("denies a user outside local and dev who is not in the group", () => {
    renderWithIdvAccess(false);

    expect(screen.getByText("denied")).toBeTruthy();
  });
});
