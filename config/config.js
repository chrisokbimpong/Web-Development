/**
 * Configuration.
 */

var path = require('path'),
    logger = require('winston');

var config = {};

config.LOG_FILENAME = './logs/thequiz_log_';
config.logger = logger;

config.APP_TITLE = 'Quiz Application';
config.APP_PORT = 3000;
config.APP_BASE_PATH = process.env.PWD;

config.AUTH_USE_LDAP = false;
config.AUTH_LDAP_CONFIG = {
    url: 'ldap://example.com',
    adminDn: 'uid=admin_username',
    adminPassword: '******',
    searchBase: 'ou=People,l=Kannamapettai,dc=example.com',
    searchFilter: '(uid={{username}})',
    timeout: 1000,
    connectTimeout: 1500,
    cache: true
};

config.URL = {
    MAIN: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT: '/forgot',
    RESET: '/reset',
    ACTIVATE: '/activate',
    LOGOUT: '/logout',
    FAQ: '/faq',
    FEEDBACK: '/feedback',
    TIMECLOSED: '/timeclosed',
    QUIZ_MAIN: '/quiz',
    QUIZ_ADMIN: '/quiz/admin',
    QUIZ_START: '/quiz/start',
    QUIZ_NOQUIZ: '/quiz/noquiz',
    QUIZ_STANDINGS: '/quiz/standings',
    QUIZ_STAT_AJAX: '/quiz/get',
    QUIZ_ADMIN_SAVE_AJAX: '/quiz/admin/save',
    QUIZ_ADMIN_SAVE_UPLOAD: '/quiz/admin/upload',
    QUIZ_ADMIN_DATA: '/quiz/admin/userdata',
    QUIZ_ADMIN_FEEDBACK: '/quiz/admin/feedback',
    QUIZ_ADMIN_ARCHIVE: '/quiz/admin/archive',
    QUIZ_ADMIN_DATA_AJAX: '/quiz/admin/get'
};

config.TEMPL_LOGIN = 'login.html';
config.TEMPL_RESET = 'reset.html';
config.TEMPL_500 = '500.html';
config.TEMPL_403 = '403.html';
config.TEMPL_404 = '404.html';
config.TEMPL_200 = '200.html';
config.TEMPL_TIMECLOSED = 'timeclosed.html';
config.TEMPL_FAQ = 'faq.html';
config.TEMPL_FEEDBACK = 'feedback.html';
config.TEMPL_QUIZ_MAIN = 'quiz.html';
config.TEMPL_QUIZ_START = 'question.html';
config.TEMPL_QUIZ_END = 'completed.html';
config.TEMPL_QUIZ_NOQUIZ = 'noquiz.html';
config.TEMPL_QUIZ_ADMIN = 'admin.html';
config.TEMPL_QUIZ_ADMIN_DATA = 'userdata.html';
config.TEMPL_QUIZ_ADMIN_FEEDBACK = 'feedback_admin.html';
config.TEMPL_QUIZ_ADMIN_ARCHIVE = 'archive.html';
config.TEMPL_QUIZ_STANDINGS = 'standings.html';

config.QUIZ_START_TIME = [22, 0];
config.QUIZ_STOP_TIME = [24, 0];

config.DB_HOST = '127.0.0.1';
config.DB_PORT = 27017;
config.DB_USERNAME = '';
config.DB_PASSWORD = '';
config.DB_NAME = 'quiz_db';
config.DB_AUTH_TABLE = 'quiz_users';
config.DB_AUTHLDAP_TABLE = 'quiz_ldap_users';
config.DB_AUTH_SESSIONS = 'quiz_sessions';
config.DB_AUTH_PASSWORD_RESET = 'quiz_resets';
config.DB_QUESTIONS_TABLE = 'quiz_questions';
config.DB_QUIZ_HISTORY = 'quiz_history';
config.DB_USER_FEEDBACK = 'quiz_feedback';
config.DB_MONGO_CONNECT_STRING = 'mongodb://' + config.DB_HOST + '/' + config.DB_NAME;

config.MAIL_SERVER_NOAUTH = false;
config.MAIL_DEBUG = false;
config.MAIL_HOST = 'smtp.gmail.com';
config.MAIL_PORT = 587;
config.MAIL_SECURE = false;
config.MAIL_USE_TLS = true;
config.MAIL_USERNAME = 'sirhcgg@gmail.com';
config.MAIL_PASSWORD = 'py_stdio';
config.MAIL_SENDER = 'Quiz Master <quiz@example.com>';
config.MAIL_USER_DOMAIN = '@gmail.com';

config.MAIL_TEMPLATE = './views/mailer.html';
config.MAIL_LOGO = './public/images/logo.png';

config.ERR_AUTH_FAILED = 'Authentication failed, please check your username and password.';
config.ERR_AUTH_LDAP_ERROR = 'Could not authenticate properly with LDAP server. Ask your administrator to check the LDAP configuration!';
config.ERR_AUTH_LDAP_SERVER_DOWN = 'Could not connect to the authentication server!';
config.ERR_AUTH_INVALID_USERNAME = 'Username is invalid!';
config.ERR_AUTH_INVALID_PASSWORD = 'Invalid password!';
config.ERR_AUTH_NOT_LOGGED_IN = 'You must be logged in to view that page!';
config.ERR_AUTH_ACTIVATION_PENDING = 'You still haven\'t activated this account. Please check your mail!';
config.ERR_SIGNUP_ALREADY_EXISTS = 'Username already exists!';
config.ERR_SIGNUP_DATA_MISSING = 'One or more of the fields are empty.';
config.ERR_SIGNUP_PASSWORD_MISMATCH = 'Your passwords do not match.';
config.ERR_ACTIVATION_INVALID_KEY = 'Username mapped to activation key is invalid!';
config.ERR_RESET_INVALID_DETAILS = 'One of the values entered is incorrect!';
config.ERR_RESET_INVALID_USERNAME = 'Username not valid. Looks like you forgot your username as well!';
config.ERR_QUIZ_NOQUIZTODAY = 'No quiz found in database';
config.ERR_ADMIN_NOQUESTIONFOUND = 'This question no longer exists in the database.';

config.MASTER_SALT = 'cycle_la_illayam_kaathu_ernakulathula_illayam_vaathu';
config.RESET_PASSWORD_SALT = 'loln00b';

config.COMPANY_SHORT_NAME = 'Amalitech';
config.COMPANY_LONG_NAME = 'Amalitech Training Academy';
config.RESET_VALIDITY = 3;
config.SECURITY_QUESTIONS = [
    'What is your mother\'s maiden name?',
    'What is the name of your first pet?',
    'What is the name of your first boyfriend/girlfriend?',
    'What is the meaning of life?',
    'What is the average velocity of an unladen swallow?',
    'Who let the dogs out?'
];

config.IE_START_URL = 'http://quiz_homepage.com';
config.IE_FAVICON_URL = 'http://quiz_homepage.com/images/favicon.ico';
config.IE_FAQ_URL = config.IE_START_URL + config.URL.FAQ;

config.UPLOAD_DIR = '/uploads/';

if (config.AUTH_USE_LDAP) {
    config.TEMPL_LOGIN = 'login_ldap.html'
}

module.exports = config;