import { useEffect } from "react";
import { useUser } from "./useUser.tsx";
import {
    CONTEXT_ACTIONS
} from "../../utils/constants";



export default function rpTargetUrl() {
    const { state, dispatch } = useUser();
    console.log("rpTargetUrl component mounted LAODED");
    function setRelyingPartyParams() {

        const searchParams = new URLSearchParams(window.location.search)
        console.log("rpTargetUrl and stateID", searchParams)

        const rpTargetUrl = searchParams.get("Target")
        const stateId = searchParams.get("stateId");
        const themeId = searchParams.get("themeId");
        if (rpTargetUrl) {
            console.log("rpTargetUrl and stateID", stateId, themeId)
            try {
                const params = new URLSearchParams({
                    stateId: stateId,
                    themeId: themeId
                });
                const fullUrl = `${rpTargetUrl}&${params.toString()}`;

                const userData = { ...state.userData, relyingPartyTargetValue: encodeURIComponent(fullUrl) };
                dispatch({ type: CONTEXT_ACTIONS.signUp, payload: userData });
                console.log("added to user data", userData)
            } catch (err) {
                console.error("Missing Target URL", err)
            }
        }
    }

    useEffect(() => {
        setRelyingPartyParams()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null
}