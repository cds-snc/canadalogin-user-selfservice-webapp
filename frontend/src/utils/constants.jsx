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
    'gcds-input2':{
        name:'gcds-input',
        attributes: ['input-id', 'label', 'name', 'type', 'class', 'hint']
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
    'gcds-footer2':{
        name:'gcds-footer',
        attributes: ["display", "sub-links"]
    },
    'gcds-header':{
        name:'gcds-header',
        attributes: ['lang', 'lang-href', 'signature-variant']
    },
    'gcds-header2':{
        name:'gcds-header',
        attributes: ['lang', 'lang-href', 'signature-variant', 'skip-to-href']
    },
    'gcds-details':{
        name:'gcds-details',
        attributes: ['details-title']
    },
    'gcds-details2':{
        name:'gcds-details',
        attributes: ['details-title']
    },
    'gcds-stepper':{
        name:'gcds-stepper',
        attributes: ['current-step', 'tag', 'total-steps']
    },
    'gcds-stepper2':{
        name:'gcds-stepper',
        attributes: ['current-step', 'tag', 'total-steps', 'lang', 'margin-bottom', 'margin-top']
    },
    'gcds-notice':{
        name:'gcds-notice',
        attributes: ['notice-title', 'notice-title-tag', 'type']
    },
    'small':{
        name:'small',
        attributes: ['class', 'id']
    },
    'gcds-checkbox':{
        name:'gcds-checkbox',
        attributes: ['checkbox-id', 'label', 'name']
    }
}


