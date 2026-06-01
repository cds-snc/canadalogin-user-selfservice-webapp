import { describe, expect, it, vi } from "vitest";

import { CONTEXT_ACTIONS } from "../constants";
import { userProfileDispatch } from "../userProfileDispatch";

describe("utils/userProfileDispatch", () => {
  it("dispatches setLoading with explicit text", () => {
    const dispatch = vi.fn();
    const profileDispatch = userProfileDispatch(dispatch);

    profileDispatch.setLoading(true, "Loading profile");

    expect(dispatch).toHaveBeenCalledWith({
      type: CONTEXT_ACTIONS.set_loading,
      payload: { isLoading: true, text: "Loading profile" },
    });
  });

  it("dispatches setLoading with null text by default", () => {
    const dispatch = vi.fn();
    const profileDispatch = userProfileDispatch(dispatch);

    profileDispatch.setLoading(false);

    expect(dispatch).toHaveBeenCalledWith({
      type: CONTEXT_ACTIONS.set_loading,
      payload: { isLoading: false, text: null },
    });
  });

  it("dispatches profile update success payload", () => {
    const dispatch = vi.fn();
    const profileDispatch = userProfileDispatch(dispatch);
    const payload = { firstName: "Taylor", lastName: "Jordan" };

    profileDispatch.updateProfileSuccess(payload);

    expect(dispatch).toHaveBeenCalledWith({
      type: CONTEXT_ACTIONS.updated_profile_success,
      payload,
    });
  });

  it("dispatches setAuthenticatedPage", () => {
    const dispatch = vi.fn();
    const profileDispatch = userProfileDispatch(dispatch);

    profileDispatch.setAuthenticatedPage("security-settings");

    expect(dispatch).toHaveBeenCalledWith({
      type: CONTEXT_ACTIONS.set_authenticated_pages,
      payload: "security-settings",
    });
  });

  it("dispatches removeAuthenticatedPage", () => {
    const dispatch = vi.fn();
    const profileDispatch = userProfileDispatch(dispatch);

    profileDispatch.removeAuthenticatedPage("security-settings");

    expect(dispatch).toHaveBeenCalledWith({
      type: CONTEXT_ACTIONS.remove_authenticated_page,
      payload: "security-settings",
    });
  });
});
