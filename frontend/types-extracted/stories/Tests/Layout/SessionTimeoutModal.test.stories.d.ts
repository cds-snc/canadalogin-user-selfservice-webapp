declare namespace _default {
    export let title: string;
    export { SessionTimeoutModal as component };
    export namespace parameters {
        namespace docs {
            let disable: boolean;
        }
        let layout: string;
        namespace test {
            let dangerouslyIgnoreUnhandledErrors: boolean;
        }
    }
    export namespace args {
        let isOpen: boolean;
        let expirationTime: Date;
        let currentLang: string;
        let isLoading: boolean;
        function onKeepSession(...args: any[]): Promise<void>;
        function onLogout(...args: any[]): Promise<void>;
    }
}
export default _default;
export namespace ComponentRenders {
    let name: string;
    function play({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
}
export namespace ClickStaySignedInButton {
    let name_1: string;
    export { name_1 as name };
    export function play_1({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_1 as play };
}
export namespace ClickSignOutButton {
    let name_2: string;
    export { name_2 as name };
    export function play_2({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_2 as play };
}
export namespace LoadingState {
    let name_3: string;
    export { name_3 as name };
    export namespace args_1 {
        let isLoading_1: boolean;
        export { isLoading_1 as isLoading };
    }
    export { args_1 as args };
    export function play_3({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_3 as play };
}
export namespace ModalContentDisplay {
    let name_4: string;
    export { name_4 as name };
    export function play_4({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_4 as play };
}
export namespace FrenchLanguage {
    let name_5: string;
    export { name_5 as name };
    export namespace args_2 {
        let currentLang_1: string;
        export { currentLang_1 as currentLang };
    }
    export { args_2 as args };
    export function play_5({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_5 as play };
}
export namespace KeyboardNavigation {
    let name_6: string;
    export { name_6 as name };
    export function play_6({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_6 as play };
}
export namespace ModalClosed {
    let name_7: string;
    export { name_7 as name };
    export namespace args_3 {
        let isOpen_1: boolean;
        export { isOpen_1 as isOpen };
    }
    export { args_3 as args };
    export function play_7({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_7 as play };
}
export namespace MobileBreakpoint {
    let name_8: string;
    export { name_8 as name };
    export namespace parameters_1 {
        namespace viewport {
            let defaultViewport: string;
        }
    }
    export { parameters_1 as parameters };
    export function play_8({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_8 as play };
}
export namespace TabletBreakpoint {
    let name_9: string;
    export { name_9 as name };
    export namespace parameters_2 {
        export namespace viewport_1 {
            let defaultViewport_1: string;
            export { defaultViewport_1 as defaultViewport };
        }
        export { viewport_1 as viewport };
    }
    export { parameters_2 as parameters };
    export function play_9({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_9 as play };
}
export namespace MissingExpirationTime {
    let name_10: string;
    export { name_10 as name };
    export namespace args_4 {
        let expirationTime_1: any;
        export { expirationTime_1 as expirationTime };
    }
    export { args_4 as args };
    export function play_10({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_10 as play };
}
export namespace UndefinedCallbacks {
    let name_11: string;
    export { name_11 as name };
    export namespace args_5 {
        let onKeepSession_1: any;
        export { onKeepSession_1 as onKeepSession };
        let onLogout_1: any;
        export { onLogout_1 as onLogout };
    }
    export { args_5 as args };
    export function play_11({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_11 as play };
}
export namespace UndefinedLanguage {
    let name_12: string;
    export { name_12 as name };
    export namespace args_6 {
        let currentLang_2: any;
        export { currentLang_2 as currentLang };
    }
    export { args_6 as args };
    export function play_12({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_12 as play };
}
export namespace LoadingStateSignOut {
    let name_13: string;
    export { name_13 as name };
    export namespace args_7 {
        let isLoading_2: boolean;
        export { isLoading_2 as isLoading };
    }
    export { args_7 as args };
    export function play_13({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_13 as play };
}
export namespace ResponsiveRenderingLogic {
    let name_14: string;
    export { name_14 as name };
    export function play_14({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_14 as play };
}
import SessionTimeoutModal from "../../../components/Layout/SessionTimeoutModal";
