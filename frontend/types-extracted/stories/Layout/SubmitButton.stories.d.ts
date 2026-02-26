declare namespace _default {
    export let title: string;
    export { SubmitButton as component };
    export let tags: string[];
    export namespace parameters {
        let layout: string;
    }
}
export default _default;
export namespace English {
    namespace args {
        let currentLang: string;
    }
}
export namespace French {
    export namespace args_1 {
        let currentLang_1: string;
        export { currentLang_1 as currentLang };
    }
    export { args_1 as args };
}
export namespace NoLanguage {
    export namespace args_2 {
        let currentLang_2: string;
        export { currentLang_2 as currentLang };
    }
    export { args_2 as args };
}
export namespace EnglishDisabled {
    export namespace args_3 {
        let currentLang_3: string;
        export { currentLang_3 as currentLang };
        export let disabled: boolean;
    }
    export { args_3 as args };
}
export namespace FrenchDisabled {
    export namespace args_4 {
        let currentLang_4: string;
        export { currentLang_4 as currentLang };
        let disabled_1: boolean;
        export { disabled_1 as disabled };
    }
    export { args_4 as args };
}
export namespace NoLanguageDisabled {
    export namespace args_5 {
        let currentLang_5: string;
        export { currentLang_5 as currentLang };
        let disabled_2: boolean;
        export { disabled_2 as disabled };
    }
    export { args_5 as args };
}
import SubmitButton from "../../components/Layout/SubmitButton.jsx";
