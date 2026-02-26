declare namespace _default {
    export let title: string;
    export { Footer as component };
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
import Footer from "../../components/Layout/Footer.jsx";
