import { useEffect } from "react";
import { useUser } from "./useUser.tsx";
import {
    CONTEXT_ACTIONS
} from "../../utils/constants";



export default function rpTargetUrl() {
    const { state, dispatch } = useUser();
    function setRelyingPartyParams() {

        const searchParams = new URLSearchParams(window.location.search)
        console.log("rpTargetUrl and stateID", searchParams)

        const rpTargetUrl = searchParams.get("Target")
        const stateId = searchParams.get("stateId");
        const themeId = searchParams.get("themeId");
        if (rpTargetUrl) {
            console.log("rpTargetUrl and stateID", rpTargetUrl)

            const fullUrl = `${rpTargetUrl}&stateId=${stateId}&themeId=${themeId}`; // required if we use signup redirect from flow designer
            console.log(decodeURIComponent(rpTargetUrl).length)
            const userData = { ...state.userData, relyingPartyTargetValue: encodeURIComponent(rpTargetUrl) };
            dispatch({ type: CONTEXT_ACTIONS.signUp, payload: userData });
            console.log("added to user data", state)

        } else {
            console.error("Missing Target URL")

        }
        console.log("added to user data", state)
    }

    useEffect(() => {
        setRelyingPartyParams()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null
}