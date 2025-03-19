export const AVAILABLE_LANGUAGES = {en:'en', fr:'fr'};
export const NAVIGATION_LINKS = {
    signUp: '/signup',
    verifyEmail: '/signup/verifyemail',
    password: '/signup/password'
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
    signup: '/api/email/sendEmailOtp',
    emailVerification: '/api/email/verifyEmailOtp',
    requestNewCode: '/api/email/requestNewCode',
    requestPasswordPolicy: '/v1/password/policy'
}


