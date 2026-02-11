import React from "react";
import { CONTEXT_ACTIONS } from "./constants";
import { Action } from "../types";

type Dispatch = React.Dispatch<Action>;

export const userProfileDispatch = (dispatch: Dispatch) => ({
  setLoading: (isLoading: boolean, text: string | null = null) =>
    dispatch({
      type: CONTEXT_ACTIONS.set_loading,
      payload: { isLoading, text },
    }),

  updateProfileSuccess: (data: unknown) =>
    dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: data }),

  setAuthenticatedPage: (value: string) =>
    dispatch({ type: CONTEXT_ACTIONS.set_authenticated_pages, payload: value }),
  removeAuthenticatedPage: (value: string) =>
    dispatch({
      type: CONTEXT_ACTIONS.remove_authenticated_page,
      payload: value,
    }),
});
