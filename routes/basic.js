var config = require('../config/config'),
    user = require('../utils/user');

module.exports = function (app) {

    app.get(config.URL.MAIN, function (req, res) {
        config.logger.info('QUIZ - MAIN - PAGE GET', {
            username: (req.session.user) ? req.session.user.username : 'AnonymousUser'
        });
        if (req.session.user) {
            res.redirect(config.URL.QUIZ_MAIN);
        } else {
            res.render(config.TEMPL_LOGIN, {
                tab: 'login'
            });
        }
    });

    app.get(config.URL.LOGIN, function (req, res) {
        config.logger.info('LOGIN - PAGE GET');
        res.render(config.TEMPL_LOGIN, {
            tab: 'login'
        });
    });

    app.post(config.URL.LOGIN, function (req, res) {
        var username = req.body.username;
        config.logger.info('LOGIN - FORM POST', {
            username: username,
            auth_ldap: config.AUTH_USE_LDAP
        });
        user.authenticate(username, req.body.password, function (err, user) {
            if (user) {
                req.session.regenerate(function () {
                    config.logger.info('LOGIN - SESSION REGENERATED SUCCESSFULLY', {
                        username: username
                    });
                    //Custom session variables.
                    req.session.user = user;
                    req.session.is_admin = user.admin;
                    req.session.last_seen = user.last_seen;
                    req.session.success = 'Authenticated as ' + user.username;
                    res.redirect(config.URL.QUIZ_MAIN);
                });
            } else {
                config.logger.warn('LOGIN - LOGIN FAILED', {
                    username: username,
                    error: err.message
                });
                req.session.error = err.message;
                res.redirect(config.URL.LOGIN);
            }
        });
    });

    app.get(config.URL.LOGOUT, function (req, res) {
        config.logger.info('LOGOUT', {
            username: req.session.user.username
        });
        req.session.destroy(function () {
            res.redirect(config.URL.MAIN);
        });
    });

    app.get(config.URL.TIMECLOSED, user.requiredAuthentication, function (req, res) {
        res.render(config.TEMPL_TIMECLOSED, {
            start_time: config.QUIZ_START_TIME,
            stop_time: config.QUIZ_STOP_TIME,
            current_time: [new Date().getHours(), new Date().getMinutes()]
        });
    });

    app.get(config.URL.FAQ, function (req, res) {
        res.render(config.TEMPL_FAQ, {
            username: (req.session.user) ? req.session.user.username : null,
            start_time: config.QUIZ_START_TIME,
            stop_time: config.QUIZ_STOP_TIME
        });
    });

    app.get(config.URL.FEEDBACK, user.requiredAuthentication, function (req, res) {
        res.render(config.TEMPL_FEEDBACK);
    });

    app.post(config.URL.FEEDBACK, user.requiredAuthentication, function (req, res) {
        var username = req.session.user.username,
            form_data = req.body;
        form_data['user_agent'] = req.headers['user-agent'];
        config.logger.info('FEEDBACK - FORM POST', {
            username: username,
            form_data: form_data
        });
        user.saveFeedback(username, form_data);
        res.render(config.TEMPL_FEEDBACK, {
            'form_submitted': true
        });
    });
};