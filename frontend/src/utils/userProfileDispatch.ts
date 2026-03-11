import type { UserDispatch } from "../types/user";
import { CONTEXT_ACTIONS } from "./constants";
import type { UserProfileDispatchContract } from "../types/utils";

export const userProfileDispatch = (
  dispatch: UserDispatch,
): UserProfileDispatchContract => ({
  setLoading: (isLoading, text = null) =>
    dispatch({
      type: CONTEXT_ACTIONS.set_loading,
      payload: { isLoading, text },
    }),

  updateProfileSuccess: (data) =>
    dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: data }),

  setAuthenticatedPage: (value) =>
    dispatch({ type: CONTEXT_ACTIONS.set_authenticated_pages, payload: value }),

  removeAuthenticatedPage: (value) =>
    dispatch({
      type: CONTEXT_ACTIONS.remove_authenticated_page,
      payload: value,
    }),
});
