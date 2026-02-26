import { CONTEXT_ACTIONS } from "./constants";
import type { Dispatch } from "react";

export const userProfileDispatch = (dispatch: Dispatch<any>) => ({
  setLoading: (isLoading: boolean, text: string | null = null) =>
    dispatch({
      type: CONTEXT_ACTIONS.set_loading,
      payload: { isLoading, text },
    }),

  updateProfileSuccess: (data: any) =>
    dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: data }),

  setAuthenticatedPage: (value: any) =>
    dispatch({ type: CONTEXT_ACTIONS.set_authenticated_pages, payload: value }),
  removeAuthenticatedPage: (value: any) =>
    dispatch({
      type: CONTEXT_ACTIONS.remove_authenticated_page,
      payload: value,
    }),
});
