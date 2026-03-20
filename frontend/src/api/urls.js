

// -------------------- AUTH --------------------
export const URL_VALIDATE = "/auth/validate"
export const URL_ACTIVATE = "/auth/activate"
export const URL_LOGIN = "/auth/login"
export const URL_REQUEST_VALIDATION = "/auth/login/request-validation"
export const URL_SIGNUP = "/auth/signup"
export const URL_LOGIN_JWT = "/auth/login/jwt"
export const URL_CHANGE_PASSWORD = "/auth/password/change"
export const URL_RESET_PASSWORD_REQUEST = "/auth/password/request-reset"
export const URL_RESET_PASSWORD = "/auth/password/reset"
export const URL_DELETE_ACCOUNT = "/auth/delete"
export const URL_DELETE_ACCOUNT_confirm = "/auth/delete/confirm"
export const URL_VALIDATE_RESEND = "/auth/validate/resend"


// -------------------- BIKES --------------------
export const URL_BIKES_LIST = "/vehicles/list"
export const URL_BIKES_CREATE = "/vehicles/create"
export const URL_BIKES_UPDATE = "/vehicles/update"


// -------------------- ASSIGNMENTS --------------------
export const URL_ASSIGNMENTS_LIST_FREE = "/assignments/list/free"
export const URL_ASSIGNMENTS_CREATE = "/assignments/create"
export const URL_ASSIGNMENTS_LIST_MINE = "/assignments/list/mine"
export const URL_ASSIGNMENTS_LIST_HISTORY = "/assignments/list/history"
export const URL_ASSIGNMENTS_CANCEL = "/assignments/delete"
export const URL_ASSIGNMENTS_EXPORT = "/assignments/list/export-csv"

// -------------------- USERS --------------------
export const URL_USERS_LIST = "/users/list"
export const URL_USERS_CREATE = "/users/create"
export const URL_USERS_UPDATE = "/users/update"
export const URL_USERS_DELETE = "/users/delete"



// -------------------- CONFIGURATION --------------------
export const URL_CONFIGURATION_LIST = "/config/list"
export const URL_CONFIGURATION_CREATE = "/config/create"
export const URL_CONFIGURATION_DELETE = "/config/delete"
export const URL_CONFIGURATION_UPDATE = "/config/update"




// -------------------- VERSION --------------------
export const URL_CHANGELOG_LIST = "/version/changelog"

// -------------------- LOCATIONS --------------------
export const URL_GET_LOCATIONS = "/locations/list"
export const URL_GET_POLICIES = "/config/list/policies"

//-------------------- SUPER --------------------
export const URL_GET_ACTIONS = "/actions/list" //pagination
export const URL_GET_USER_ACTIONS = "/actions/user" //pagination

// -------------------- INVITATIONS --------------------
export const URL_INVITATION_INFO = (token) => `/invitations/${token}`
export const URL_INVITATION_ACCEPT = (token) => `/invitations/${token}/accept`
export const URL_INVITATIONS_ME = '/invitations/me'
export const URL_WORKSPACES = '/workspaces'

// // CHANGELOG
// export const URL_CHANGELOG_LIST = "/version/changelog"