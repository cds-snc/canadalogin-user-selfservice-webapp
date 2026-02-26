declare namespace _default {
    export let title: string;
    export { Header as component };
    export let tags: string[];
    export namespace parameters {
        let layout: string;
    }
    export let decorators: ((Story: any) => import("react/jsx-runtime").JSX.Element)[];
}
export default _default;
export namespace English {
    namespace args {
        let currentLang: string;
        let langHref: string;
    }
}
export namespace French {
    export namespace args_1 {
        let currentLang_1: string;
        export { currentLang_1 as currentLang };
        let langHref_1: string;
        export { langHref_1 as langHref };
    }
    export { args_1 as args };
}
export namespace NoLanguage {
    export namespace args_2 {
        let currentLang_2: string;
        export { currentLang_2 as currentLang };
        let langHref_2: string;
        export { langHref_2 as langHref };
    }
    export { args_2 as args };
}
import Header from "../../components/Layout/Header.jsx";
