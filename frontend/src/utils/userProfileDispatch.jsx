import { CONTEXT_ACTIONS } from "./constants";

export const userProfileDispatch = (dispatch) => ({
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
