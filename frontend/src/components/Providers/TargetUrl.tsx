import { useEffect } from "react";
import { useUser } from "./useUser.tsx";
import {
    CONTEXT_ACTIONS
} from "../../utils/constants";



export default function rpTargetUrl() {
    const { state, dispatch } = useUser();

    function setRelyingPartyParams() {

        const searchParams = new URLSearchParams(window.location.search)
        const rpTargetUrl = searchParams.get("Target")
        if (rpTargetUrl) {
            try {
                const userData = { ...state.userData, relyingPartyTargetValue: encodeURIComponent(rpTargetUrl) };
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