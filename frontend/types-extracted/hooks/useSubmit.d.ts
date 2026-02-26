import { FormEvent } from "react";
import type { SubmitDataOptions, SubmitData } from "../types/hooks";
export declare function useSubmit(submitDataOptions: SubmitDataOptions, validateFunction: any): {
    handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    isPending: boolean;
};
export declare function callAnalytics(submitDataOptions: SubmitDataOptions, submitAction: string, label: string): Promise<void>;
export declare function callAuthService(submitDataOptions: SubmitDataOptions, submitData: SubmitData, userData: any): Promise<any>;
