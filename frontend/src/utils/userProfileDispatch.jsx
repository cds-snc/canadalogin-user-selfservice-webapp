// utils/profileActions.ts
import { AVAILABLE_LANGUAGES, FOOTERS, CONTEXT_ACTIONS } from './constants';

export const userProfileDispatch = (dispatch) => ({
    cloneUserProfile: () =>
        dispatch({ type: CONTEXT_ACTIONS.clone_profile, payload: null }),

    updateClonedProfile: (value) =>
        dispatch(
            {
                type: CONTEXT_ACTIONS.update_cloned_profile, payload: { ...value }
            }
        ),
    setOriginalLanguageBeforeEdit: (language) =>
        dispatch(
            {
                type: CONTEXT_ACTIONS.set_original_language_before_edit, payload: language
            }
        ),
    cancelProfileEditing: (boolean) =>
        dispatch({ type: CONTEXT_ACTIONS.cancel_profile_editing, payload: boolean }),

    clearEditProfile: () =>
        dispatch({ type: CONTEXT_ACTIONS.clear_edit_profile, payload: null }),

    updateProfileSuccess: (data) =>
        dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: data }),

    updateProfileFailure: () =>
        dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: null }),




});
