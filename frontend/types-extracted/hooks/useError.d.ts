export declare function useError(language: string): {
    setError: (link: string, errorId: string) => void;
    clearAllErrors: () => void;
    getError: (index: string) => {
        heading: any;
        errorMsg: string;
    };
    hasErrors: () => boolean;
};
