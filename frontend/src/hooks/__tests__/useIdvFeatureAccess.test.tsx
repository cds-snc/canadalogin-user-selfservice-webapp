import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UserContext from "../../components/Providers/UserContext";
import type { UserContextValue } from "../../types/user";
import { useIdvFeatureAccess } from "../useIdvFeatureAccess";

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
  it("allows a user whose feature flag is enabled", () => {
    renderWithIdvAccess(true);

    expect(screen.getByText("allowed")).toBeTruthy();
  });

  it("denies a user whose feature flag is disabled", () => {
    renderWithIdvAccess(false);

    expect(screen.getByText("denied")).toBeTruthy();
  });
});
