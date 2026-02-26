import { SubmitDataOptions } from "./useSubmit";
export declare function useLinkSubmit(submitDataOptions: SubmitDataOptions): {
    handleLinkSubmit: (linkFlowType: string, changeType: boolean) => Promise<void>;
    isPending: boolean;
    codeRequested: boolean;
    timesRequested: number;
};
