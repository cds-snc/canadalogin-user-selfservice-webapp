export function userProfileDispatch(dispatch: any): {
    setLoading: (isLoading: any, text?: any) => any;
    updateProfileSuccess: (data: any) => any;
    setAuthenticatedPage: (value: any) => any;
    removeAuthenticatedPage: (value: any) => any;
};
