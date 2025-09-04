import { useNavigate } from "react-router";

export function useNavigateHelper() {
    const navigate = useNavigate();
    return (path: string, replaceHistory: boolean = false) => navigate(path, { replace: replaceHistory });
}
