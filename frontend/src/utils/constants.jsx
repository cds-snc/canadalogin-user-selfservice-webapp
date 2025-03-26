export const AVAILABLE_LANGUAGES = {en:'en', fr:'fr'};
export const NAVIGATION_LINKS = {
    signUp: '/signup',
    verifyEmail: '/signup/verifyemail',
    password: '/signup/password',
    twoStepVerification: '/signup/registerverification'
};
export const CONTEXT_ACTIONS = {
    signUp: 'SIGN_UP',
    signIn: 'SIGN_IN',
    logOut: 'LOG_OUT'
};

export const FOOTERS = {
        default: {
            en: '{ "About GC Sign in": "#", "Help": "#", "Terms": "#" }',
            fr: '{ "À propos de Connexion GC": "#", "Aide": "#", "Avis": "#" }'
        }
}

export const SERVICES=[
    {
        id: 1,
        title: 'GEO.ca',
        description: ''
    }
];

export const SUBMIT_END_POINTS = {
    sendOtpCode: '/v1/otp/email/send',
    emailVerification: '/v1/otp/email/verify',
    requestNewCode: '/v1/otp/email/send',
    requestPasswordPolicy: '/v1/password/policy',
    create: '/v1/users/create'
}

export const GCDS_TAG_ATTRIBUTES = {
    'gcds-input':{
        name:'gcds-input',
        attributes: ['input-id', 'label', 'name', 'type', 'validate-on']
    },
    'gcds-fieldset':{
        name:'gcds-fieldset',
        attributes: ["fieldset-id", "hint", "legend"]
    },
    'gcds-radio-group':{
        name:'gcds-radio-group',
        attributes:  ["name", "options"]
    },
    'gcds-button':{
        name:'gcds-button',
        attributes: ["type"]
    },
    'gcds-footer':{
        name:'gcds-footer',
        attributes: ["sub-links"]
    },
    'gcds-header':{
        name:'gcds-header',
        attributes: ['lang', 'lang-href', 'signature-variant']
    },
    'gcds-details':{
        name:'gcds-details',
        attributes: ['details-title']
    },
    'gcds-stepper':{
        name:'gcds-stepper',
        attributes: ['current-step', 'tag', 'total-steps']
    }
}


