var config = require('../config/config');

var getMaxOrMinofArray = function (maxormin, array_dict, column, fn) {
    var array = Object.keys(array_dict).map(function (key) {
        return array_dict[key];
    });
    var max = array.reduce(function (previousVal, currentItem, array, arr) {
        if (maxormin == 'max') {
            return Math.max(previousVal, currentItem[column]);
        } else {
            return Math.min(previousVal, currentItem[column]);
        }
    }, Number.NEGATIVE_INFINITY);

    fn(null, array.filter(function (i) {
        return (null, i[1] == max);
    }));
}

var getMonday = function (fn) {
    var today = new Date();
    var day = today.getDay(),
        diff = today.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    fn(null, new Date(today.setDate(diff)));
}

var validateSignUpForm = function (request_body, fn) {
    var username = request_body.username;
    var password = request_body.first_password;
    var password1 = request_body.second_password;
    var security_question = request_body.security_question;
    var security_answer = request_body.security_answer;

    if (username && password && password1 && security_question && security_answer) {
        if (password === password1) {
            return fn(null, true);
        } else {
            return fn(config.ERR_SIGNUP_PASSWORD_MISMATCH, false);
        }
    } else {
        return fn(config.ERR_SIGNUP_DATA_MISSING, false);
    }
}

var sanitizeText = function (input_text) {
    input_text = input_text.replace(/&/g, '&amp;').
    replace(/</g, '&lt;'). // it's not neccessary to escape >
    replace(/"/g, '&quot;').
    replace(/'/g, '&#039;');
    return input_text;
}

var stripHTMLTags = function (input_text) {
    return input_text.toString().replace(/(<([^>]+)>)/ig, '');
}

var rankByScoreAndResTime = function (a, b) {
    if (a[0] < b[0])
        return 1;
    if (a[0] > b[0])
        return -1;
    if (a[0] == b[0]) {
        if (a[2] < b[2])
            return -1;
        if (a[2] > b[2])
            return 1;
        return 0;
    }
}

module.exports = {
    getMaxOrMinofArray: getMaxOrMinofArray,
    getMonday: getMonday,
    validateSignUpForm: validateSignUpForm,
    sanitizeText: sanitizeText,
    stripHTMLTags: stripHTMLTags,
    rankByScoreAndResTime: rankByScoreAndResTime
}