import {useContext} from "react";
import UserContext from "./UserContext";

export function useUser (){
    const context = useContext(UserContext);

    if(!context)
        throw new Error("useUser should be used within a Provider");

    return context;
}