import {createContext} from "react";
import { UserContextType } from "./UserProvider";

const UserContext = createContext<UserContextType | null>(null);
export default UserContext;