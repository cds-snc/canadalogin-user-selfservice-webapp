declare namespace _default {
    export let title: string;
    export { SessionTimeoutModal as component };
    export namespace parameters {
        let layout: string;
        namespace docs {
            namespace description {
                let component: string;
            }
        }
    }
    export namespace argTypes {
        namespace isOpen {
            export let control: string;
            let description_1: string;
            export { description_1 as description };
        }
        namespace expirationTime {
            let control_1: string;
            export { control_1 as control };
            let description_2: string;
            export { description_2 as description };
        }
        namespace currentLang {
            export namespace control_2 {
                let type: string;
            }
            export { control_2 as control };
            export let options: string[];
            let description_3: string;
            export { description_3 as description };
        }
        namespace isLoading {
            let control_3: string;
            export { control_3 as control };
            let description_4: string;
            export { description_4 as description };
        }
        namespace onKeepSession {
            export let action: string;
            let description_5: string;
            export { description_5 as description };
        }
        namespace onLogout {
            let action_1: string;
            export { action_1 as action };
            let description_6: string;
            export { description_6 as description };
        }
    }
}
export default _default;
export namespace Default {
    namespace args {
        let isOpen_1: boolean;
        export { isOpen_1 as isOpen };
        let expirationTime_1: Date;
        export { expirationTime_1 as expirationTime };
        let currentLang_1: string;
        export { currentLang_1 as currentLang };
        let isLoading_1: boolean;
        export { isLoading_1 as isLoading };
    }
}
export namespace Closed {
    export namespace args_1 {
        let isOpen_2: boolean;
        export { isOpen_2 as isOpen };
        let expirationTime_2: Date;
        export { expirationTime_2 as expirationTime };
        let currentLang_2: string;
        export { currentLang_2 as currentLang };
        let isLoading_2: boolean;
        export { isLoading_2 as isLoading };
    }
    export { args_1 as args };
    export namespace parameters_1 {
        export namespace docs_1 {
            export namespace description_7 {
                let story: string;
            }
            export { description_7 as description };
        }
        export { docs_1 as docs };
    }
    export { parameters_1 as parameters };
}
export namespace Loading {
    export namespace args_2 {
        let isOpen_3: boolean;
        export { isOpen_3 as isOpen };
        let expirationTime_3: Date;
        export { expirationTime_3 as expirationTime };
        let currentLang_3: string;
        export { currentLang_3 as currentLang };
        let isLoading_3: boolean;
        export { isLoading_3 as isLoading };
    }
    export { args_2 as args };
    export namespace parameters_2 {
        export namespace docs_2 {
            export namespace description_8 {
                let story_1: string;
                export { story_1 as story };
            }
            export { description_8 as description };
        }
        export { docs_2 as docs };
    }
    export { parameters_2 as parameters };
}
export namespace French {
    export namespace args_3 {
        let isOpen_4: boolean;
        export { isOpen_4 as isOpen };
        let expirationTime_4: Date;
        export { expirationTime_4 as expirationTime };
        let currentLang_4: string;
        export { currentLang_4 as currentLang };
        let isLoading_4: boolean;
        export { isLoading_4 as isLoading };
    }
    export { args_3 as args };
    export namespace parameters_3 {
        export namespace docs_3 {
            export namespace description_9 {
                let story_2: string;
                export { story_2 as story };
            }
            export { description_9 as description };
        }
        export { docs_3 as docs };
    }
    export { parameters_3 as parameters };
}
export namespace ExpiringNow {
    export namespace args_4 {
        let isOpen_5: boolean;
        export { isOpen_5 as isOpen };
        let expirationTime_5: Date;
        export { expirationTime_5 as expirationTime };
        let currentLang_5: string;
        export { currentLang_5 as currentLang };
        let isLoading_5: boolean;
        export { isLoading_5 as isLoading };
    }
    export { args_4 as args };
    export namespace parameters_4 {
        export namespace docs_4 {
            export namespace description_10 {
                let story_3: string;
                export { story_3 as story };
            }
            export { description_10 as description };
        }
        export { docs_4 as docs };
    }
    export { parameters_4 as parameters };
}
export namespace ExpiringLater {
    export namespace args_5 {
        let isOpen_6: boolean;
        export { isOpen_6 as isOpen };
        let expirationTime_6: Date;
        export { expirationTime_6 as expirationTime };
        let currentLang_6: string;
        export { currentLang_6 as currentLang };
        let isLoading_6: boolean;
        export { isLoading_6 as isLoading };
    }
    export { args_5 as args };
    export namespace parameters_5 {
        export namespace docs_5 {
            export namespace description_11 {
                let story_4: string;
                export { story_4 as story };
            }
            export { description_11 as description };
        }
        export { docs_5 as docs };
    }
    export { parameters_5 as parameters };
}
export namespace Mobile {
    export namespace args_6 {
        let isOpen_7: boolean;
        export { isOpen_7 as isOpen };
        let expirationTime_7: Date;
        export { expirationTime_7 as expirationTime };
        let currentLang_7: string;
        export { currentLang_7 as currentLang };
        let isLoading_7: boolean;
        export { isLoading_7 as isLoading };
    }
    export { args_6 as args };
    export namespace parameters_6 {
        export namespace viewport {
            let defaultViewport: string;
        }
        export namespace docs_6 {
            export namespace description_12 {
                let story_5: string;
                export { story_5 as story };
            }
            export { description_12 as description };
        }
        export { docs_6 as docs };
    }
    export { parameters_6 as parameters };
}
export namespace Tablet {
    export namespace args_7 {
        let isOpen_8: boolean;
        export { isOpen_8 as isOpen };
        let expirationTime_8: Date;
        export { expirationTime_8 as expirationTime };
        let currentLang_8: string;
        export { currentLang_8 as currentLang };
        let isLoading_8: boolean;
        export { isLoading_8 as isLoading };
    }
    export { args_7 as args };
    export namespace parameters_7 {
        export namespace viewport_1 {
            let defaultViewport_1: string;
            export { defaultViewport_1 as defaultViewport };
        }
        export { viewport_1 as viewport };
        export namespace docs_7 {
            export namespace description_13 {
                let story_6: string;
                export { story_6 as story };
            }
            export { description_13 as description };
        }
        export { docs_7 as docs };
    }
    export { parameters_7 as parameters };
}
import SessionTimeoutModal from "../../components/Layout/SessionTimeoutModal";
