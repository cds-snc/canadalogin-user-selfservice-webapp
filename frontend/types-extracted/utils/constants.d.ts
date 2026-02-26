export namespace AVAILABLE_LANGUAGES {
    let en: string;
    let fr: string;
}
export namespace PROFILE_LANGUAGES {
    let en_1: string;
    export { en_1 as en };
    let fr_1: string;
    export { fr_1 as fr };
}
export namespace LANGUAGE_DISPLAY_NAMES {
    let en_2: {
        "en-ca": string;
        "fr-ca": string;
    };
    export { en_2 as en };
    let fr_2: {
        "en-ca": string;
        "fr-ca": string;
    };
    export { fr_2 as fr };
}
export namespace EXTERNAL_NAVIGATION_LINKS {
    let gcAccountDirectory: string;
}
export namespace OIDC_REDIRECT {
    let login: string;
    let reauth: string;
}
export const INVALID_OTP_ERROR_CODES: string[];
export namespace CONTEXT_ACTIONS {
    let logOut: string;
    let set_loading: string;
    let update_profile: string;
    let updated_profile_success: string;
    let set_language: string;
    let set_relying_party_data: string;
    let set_authenticated_pages: string;
    let remove_authenticated_page: string;
    let show_session_timeout_modal: string;
    let hide_session_timeout_modal: string;
    let set_session_timeout_loading: string;
    let reset_expire_time: string;
}
export namespace FLOW_TYPES {
    let sms: string;
    let voice: string;
    let email: string;
    let dashboard: string;
    let profile: string;
    let manage: string;
}
export namespace ServicesWithAccessInfoSectionInformation {
    let NAME: string;
    let CONTACT_PHONE_NUMBER: string;
    let LANGUAGE_PREFERENCE: string;
    let EMAIL_ADDRESS: string;
}
export namespace LINK_SUBMIT_TYPES {
    let useNewVerification: string;
    let requestNewCode: string;
}
export const FORM_FIELDS: string[];
export namespace NOTICE_TYPES {
    let mfaAdded: string;
    let mfaDeleted: string;
    let passkeyAdded: string;
    let passkeyDeleted: string;
}
export namespace PAGES {
    let verification: string;
    let otpSelection: string;
    let password: string;
    let error: string;
    let manageDashboard: string;
    let ProfileHome: string;
    let profileUpdateNameSuccess: string;
    let profileUpdateNameConfirmUpdate: string;
    let profileUpdateName: string;
    let editProfileNamePage: string;
    let enterNewPhoneNumber: string;
    let securitySettings: string;
    let editLanguagePreferences: string;
    let editLanguagePreferencePage: string;
    let confirmLanguageUpdate: string;
    let successfullyUpdatedLanguage: string;
    let editContactPhoneNumberPage: string;
    let passwordChangedConfirmation: string;
    let ServicesWithAccessInfo: string;
    let confirmContactPhoneNumberUpdate: string;
    let successfullyUpdatedContactPhoneNumber: string;
    let manage2FAVerifications: string;
    let addMFAPage: string;
    let addMFANumber: string;
    let addSecondMFA: string;
    let addSecondMFAVoiceCall: string;
    let addSecondMFATextMessage: string;
    let deleteMFAPage: string;
    let deleteMFAPhoneNumberConfirm: string;
    let transientOtpSelection: string;
    let successBanner: string;
    let passwordVerification: string;
    let editEmailPage: string;
    let editEmailEnterEmail: string;
    let emailOtpValidation: string;
    let emailConfirmUpdate: string;
    let emailUpdateSuccess: string;
    let addFIDO2PasskeyPage: string;
    let addFIDO2Passkey: string;
    let deleteFIDO2PasskeyPage: string;
    let selectFIDO2Passkey: string;
    let deleteFIDO2PasskeyConfirm: string;
    let renameFIDO2PasskeyPage: string;
}
export namespace FOOTERS {
    namespace _default {
        let en_3: string;
        export { en_3 as en };
        let fr_3: string;
        export { fr_3 as fr };
    }
    export { _default as default };
}
export const SERVICES: {
    id: number;
    title: string;
    description: string;
    url: string;
}[];
export const serverMapping: {
    [x: string]: string;
};
export namespace SUBMIT_END_POINTS {
    export let requestPasswordPolicy: string;
    export let create: string;
    export let createCoreProfile: string;
    let login_1: string;
    export { login_1 as login };
    export let transientOtpVerify: string;
    export let transientOtpSend: string;
    export let mfaEnroll: string;
    export let mfaSend: string;
    export let mfaVerify: string;
    export let mfaDelete: string;
    let profile_1: string;
    export { profile_1 as profile };
    export let profileUpdateWithOtp: string;
    export let rp_info: string;
    export let users: string;
    export let passwordUpdate: string;
    export let logout: string;
    export let sessionStatus: string;
    export let keepAlive: string;
    export let passwordVerify: string;
    export let passwordVerifyStepup: string;
}
export const RP_CLIENT_ID_KEY: "rp_client_id";
export namespace GA_CATEGORIES {
    let pageView: string;
}
export const GA_ACTIONS: {};
export namespace GA_LABELS {
    export let button: string;
    export let link: string;
    export let text: string;
    export let input: string;
    let email_1: string;
    export { email_1 as email };
}
export namespace VITE_ENVIRONMENTS {
    let dev: string;
    let test: string;
    let staging: string;
    let prod: string;
}
export const NON_PROD_FEATURE: boolean;
export namespace countryMapping {
    let countries: string[];
    namespace localization {
        let gg: string;
        let im: string;
        let je: string;
        let my: string;
    }
    namespace frLocalization {
        export let af: string;
        export let za: string;
        export let al: string;
        export let dz: string;
        export let de: string;
        export let ad: string;
        export let ao: string;
        export let ai: string;
        export let aq: string;
        export let ag: string;
        export let sa: string;
        export let ar: string;
        export let am: string;
        export let aw: string;
        export let au: string;
        export let at: string;
        export let az: string;
        export let bs: string;
        export let bh: string;
        export let bd: string;
        export let bb: string;
        export let be: string;
        export let bz: string;
        export let bj: string;
        export let bm: string;
        export let bt: string;
        export let by: string;
        export let bo: string;
        export let ba: string;
        export let bw: string;
        export let br: string;
        export let bn: string;
        export let bg: string;
        export let bf: string;
        export let bi: string;
        export let kh: string;
        export let cm: string;
        export let ca: string;
        export let cv: string;
        export let ea: string;
        export let cl: string;
        export let cn: string;
        export let cy: string;
        export let co: string;
        export let km: string;
        export let cg: string;
        export let cd: string;
        export let kp: string;
        export let kr: string;
        export let cr: string;
        export let ci: string;
        export let hr: string;
        export let cu: string;
        export let cw: string;
        export let dk: string;
        export let dg: string;
        export let dj: string;
        export let dm: string;
        export let eg: string;
        export let ae: string;
        export let ec: string;
        export let er: string;
        export let es: string;
        export let ee: string;
        export let sz: string;
        export let va: string;
        export let fm: string;
        export let us: string;
        export let et: string;
        export let fj: string;
        export let fi: string;
        let fr_4: string;
        export { fr_4 as fr };
        export let ga: string;
        export let gm: string;
        export let ge: string;
        export let gs: string;
        export let gh: string;
        export let gi: string;
        export let gr: string;
        export let gd: string;
        export let gl: string;
        export let gp: string;
        export let gu: string;
        export let gt: string;
        let gg_1: string;
        export { gg_1 as gg };
        export let gn: string;
        export let gq: string;
        export let gw: string;
        export let gy: string;
        export let gf: string;
        export let ht: string;
        export let hn: string;
        export let hu: string;
        export let cx: string;
        export let ac: string;
        let im_1: string;
        export { im_1 as im };
        export let nf: string;
        export let ax: string;
        export let ky: string;
        export let ic: string;
        export let cc: string;
        export let ck: string;
        export let fo: string;
        export let fk: string;
        export let mp: string;
        export let mh: string;
        export let um: string;
        export let pn: string;
        export let sb: string;
        export let tc: string;
        export let vg: string;
        export let vi: string;
        let _in: string;
        export { _in as in };
        export let id: string;
        export let iq: string;
        export let ir: string;
        export let ie: string;
        export let is: string;
        export let il: string;
        export let it: string;
        export let jm: string;
        export let jp: string;
        let je_1: string;
        export { je_1 as je };
        export let jo: string;
        export let kz: string;
        export let ke: string;
        export let kg: string;
        export let ki: string;
        export let xk: string;
        export let kw: string;
        export let re: string;
        export let la: string;
        export let ls: string;
        export let lv: string;
        export let lb: string;
        export let lr: string;
        export let ly: string;
        export let li: string;
        export let lt: string;
        export let lu: string;
        export let mk: string;
        export let mg: string;
        let my_1: string;
        export { my_1 as my };
        export let mw: string;
        export let mv: string;
        export let ml: string;
        export let mt: string;
        export let ma: string;
        export let mq: string;
        export let mu: string;
        export let mr: string;
        export let yt: string;
        export let mx: string;
        export let md: string;
        export let mc: string;
        export let mn: string;
        export let me: string;
        export let ms: string;
        export let mz: string;
        export let mm: string;
        export let na: string;
        export let nr: string;
        export let np: string;
        export let ni: string;
        export let ne: string;
        export let ng: string;
        export let nu: string;
        export let no: string;
        export let nc: string;
        export let nz: string;
        export let om: string;
        export let ug: string;
        export let uz: string;
        export let pk: string;
        export let pw: string;
        export let pa: string;
        export let pg: string;
        export let py: string;
        export let nl: string;
        export let bq: string;
        export let pe: string;
        export let ph: string;
        export let pl: string;
        export let pf: string;
        export let pr: string;
        export let pt: string;
        export let qa: string;
        export let hk: string;
        export let mo: string;
        export let cf: string;
        let _do: string;
        export { _do as do };
        export let ro: string;
        export let gb: string;
        export let ru: string;
        export let rw: string;
        export let eh: string;
        export let bl: string;
        export let kn: string;
        export let sm: string;
        export let mf: string;
        export let sx: string;
        export let pm: string;
        export let vc: string;
        export let sh: string;
        export let lc: string;
        export let sv: string;
        export let ws: string;
        export let as: string;
        export let st: string;
        export let sn: string;
        export let rs: string;
        export let sc: string;
        export let sl: string;
        export let sg: string;
        export let sk: string;
        export let si: string;
        export let so: string;
        export let sd: string;
        export let ss: string;
        export let lk: string;
        export let se: string;
        export let ch: string;
        export let sr: string;
        export let sj: string;
        export let sy: string;
        export let tj: string;
        export let tw: string;
        export let tz: string;
        export let td: string;
        export let cz: string;
        export let tf: string;
        export let io: string;
        export let ps: string;
        export let th: string;
        export let tl: string;
        export let tg: string;
        export let tk: string;
        export let to: string;
        export let tt: string;
        export let ta: string;
        export let tn: string;
        export let tm: string;
        export let tr: string;
        export let tv: string;
        export let ua: string;
        export let uy: string;
        export let vu: string;
        export let ve: string;
        export let vn: string;
        export let wf: string;
        export let ye: string;
        export let zm: string;
        export let zw: string;
    }
}
