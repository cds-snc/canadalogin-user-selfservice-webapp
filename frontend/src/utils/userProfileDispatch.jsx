import React, { useEffect, useCallback } from "react";

import { useNavigateHelper } from "../hooks/useNavigate.tsx";
import { useUser } from "../components/Providers/useUser";
import { useLanguage } from "../components/Providers/LanguageProvider.tsx";
import { CONTEXT_ACTIONS } from "./constants";

export const userProfileDispatch = (dispatch) => ({
  cloneUserProfile: () =>
    dispatch({ type: CONTEXT_ACTIONS.clone_profile, payload: null }),

  updateClonedProfile: (value) =>
    dispatch({
      type: CONTEXT_ACTIONS.update_cloned_profile,
      payload: { ...value },
    }),
  setOriginalLanguageBeforeEdit: (language) =>
    dispatch({
      type: CONTEXT_ACTIONS.set_original_language_before_edit,
      payload: language,
    }),
  setCancelProfileEditing: (boolean) =>
    dispatch({
      type: CONTEXT_ACTIONS.cancel_profile_editing,
      payload: boolean,
    }),

  clearEditProfile: () =>
    dispatch({ type: CONTEXT_ACTIONS.clear_edit_profile, payload: null }),

  setLoading: (isLoading, text = null) =>
    dispatch({
      type: CONTEXT_ACTIONS.set_loading,
      payload: { isLoading, text },
    }),
  loggingOut: (isLoading, text = null) =>
    dispatch({ type: CONTEXT_ACTIONS.logOut, payload: { isLoading, text } }),

  updateProfileSuccess: (data) =>
    dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: data }),

  updateProfileFailure: () =>
    dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: null }),
  setAuthenticatedPage: (value) =>
    dispatch({ type: CONTEXT_ACTIONS.set_authenticated_pages, payload: value }),
  removeAuthenticatedPage: (value) =>
    dispatch({
      type: CONTEXT_ACTIONS.remove_authenticated_page,
      payload: value,
    }),
});
export const useCancelLanguageEditing = (backtoProfile) => {
  const { state, dispatch } = useUser();
  const { setAppLanguage } = useLanguage();
  const navigateHelper = useNavigateHelper();

  const { cancelProfileEditing, editProfile } = state;
  const { clearEditProfile, setCancelProfileEditing } =
    userProfileDispatch(dispatch);

  const resetLanguage = useCallback(() => {
    const originalLanguage = state?.urlLanguageBeforeEdit;
    if (originalLanguage) {
      setAppLanguage(originalLanguage);
    }
  }, [state?.urlLanguageBeforeEdit, setAppLanguage]);

  const handleCancel = useCallback(
    (event) => {
      event.preventDefault();

      // Clear the edit profile state
      clearEditProfile();

      // Reset language to original
      resetLanguage();

      // Set cancel flag to trigger navigation effect
      setCancelProfileEditing(true);
    },
    [clearEditProfile, resetLanguage, setCancelProfileEditing],
  );

  // Effect to handle navigation after cancel
  useEffect(() => {
    if (cancelProfileEditing && editProfile === null) {
      navigateHelper(backtoProfile);
      // Reset the cancel flag after navigation
      setCancelProfileEditing(false);
    }
  }, [
    cancelProfileEditing,
    editProfile,
    navigateHelper,
    backtoProfile,
    setCancelProfileEditing,
  ]);

  return {
    handleCancel,
    resetLanguage,
  };
};
