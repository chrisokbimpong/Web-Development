var config = require('../config/config'),
    models = require('../models/models'),
    crypt = require('./pass'),
    mailer = require('./mail'),
    ldapauth = require('ldapauth-fork');

function authenticate(name, pass, fn) {
    if (config.AUTH_USE_LDAP) {
        var ldap = new ldapauth(config.AUTH_LDAP_CONFIG);
        ldap.authenticate(name, pass, function (err, user) {
            if (err && err.name === 'ConnectionError') {
                config.logger.error('LDAP AUTHENTICATION FAILED - LDAP SERVER DOWN', {
                    ldap_server: config.AUTH_LDAP_CONFIG.url
                });
                return fn(new Error(config.ERR_AUTH_LDAP_SERVER_DOWN));
            } else if (err && err.name === 'InvalidCredentialsError') {
                config.logger.error('LDAP AUTHENTICATION FAILED - INVALID CREDENTIALS', {
                    name: name,
                    error: err
                });
                return fn(new Error(config.ERR_AUTH_FAILED));
            } else if (err) {
                config.logger.warn('LDAP AUTHENTICATION FAILED - UNKNOWN ERROR', {
                    name: name,
                    ldap_error: err.name,
                    error: err
                });
                return fn(new Error(config.ERR_AUTH_LDAP_ERROR));
            } else {
                findOrCreateLDAPUser(name, function (err, user) {
                    return fn(null, user);
                });
            }
        });
    } else {
        models.User.findOne({
            username: name.toLowerCase()
        }, function (err, user) {
            if (user) {
                if (err) return fn(new Error(config.ERR_AUTH_INVALID_USERNAME));
                if (!user.activated) {
                    config.logger.warn('AUTHENTICATION - ACTIVATION PENDING', {
                        username: name
                    });
                    return fn(new Error(config.ERR_AUTH_ACTIVATION_PENDING));
                } else {
                    crypt.hash(pass, user.salt, function (err, hash) {
                        if (err) return fn(err);
                        if (hash == user.hash) return fn(null, user);
                        config.logger.warn('AUTHENTICATION - INVALID PASSWORD', {
                            username: name
                        });
                        fn(new Error(config.ERR_AUTH_INVALID_PASSWORD));
                    });
                }
            } else {
                config.logger.warn('AUTHENTICATION - INVALID USERNAME', {
                    username: name
                });
                return fn(new Error(config.ERR_AUTH_INVALID_USERNAME));
            }
        });
    }
}

function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = config.ERR_AUTH_NOT_LOGGED_IN;
        res.redirect(config.URL.LOGIN);
    }
}

function requiredAdmin(req, res, next) {
    if (req.session.is_admin) {
        next();
    } else {
        res.status(403);
        if (req.xhr) {
            res.json({
                'error': true,
                'response': 'lol nice try'
            });
        } else {
            res.render(config.TEMPL_403);
        }
    }
}

function isUsernameValid(name, fn) {
    models.User.findOne({
        username: name.toLowerCase()
    }, function (err, user) {
        if (user) {
            if (err) {
                config.logger.warn('USERNAME DOC NOT FOUND IN DB', {
                    username: name
                });
                return fn(new Error(config.ERR_AUTH_INVALID_USERNAME));
            }
            return fn(null, true);
        } else {
            return fn(null, false);
        }
    });
}

function userExist(req, res, next) {
    models.User.count({
        username: req.body.username.toLowerCase()
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            req.session.error = config.ERR_SIGNUP_ALREADY_EXISTS;
            res.redirect(config.URL.SIGNUP);
        }
    });
}

function findOrCreateLDAPUser(username, fn) {
    isUsernameValid(username, function (err, valid) {
        if (err) return fn(err, null);
        if (valid) {
            models.User.findOne({
                username: username.toLowerCase()
            }, function (err, existing_user) {
                return fn(null, existing_user);
            });
        } else {
            var user_ldap = new models.User({
                username: username
            }).save(function (err, new_user) {
                return fn(null, new_user);
            });
        }
    });
}

function activateUser(id, fn) {
    var User = models.mongoose.model(config.DB_AUTH_TABLE, models.UserSchema);
    models.User.findOne({
        _id: id
    }, function (err, user) {
        if (user) {
            User.update({
                _id: id,
                activated: false
            }, {
                activated: true
            }, {
                multi: false
            }, function (err, count) {
                if (err) {
                    throw err;
                }
                return fn(null, count);
            });
        } else {
            return fn(new Error(config.ERR_ACTIVATION_INVALID_KEY));
        }
    });
}

function validateResetKey(reset_key, fn) {
    models.PasswordReset.findOne({
        reset_key: reset_key
    }, function (err, reset_entry) {
        if (reset_entry != null) {
            if (reset_entry.used) {
                return fn(null, 'used');
            }
            var time_diff = Math.abs(new Date() - reset_entry.date) / 36e5;
            if (time_diff <= config.RESET_VALIDITY) {
                return fn(null, 'success');
            } else {
                return fn(null, 'failure');
            }
        } else {
            return fn(null, 'invalid_key');
        }
    });
}

function sendResetKey(name, security_question, security_answer, domain, ip, user_cookie, fn) {
    models.User.findOne({
        username: name.toLowerCase(),
        security_question: security_question,
        security_answer: security_answer
    }, function (err, user) {
        if (user) {
            var generateResetKey = require('./pass').generateResetKey;
            generateResetKey(user._id, function (err, reset_key) {
                var resetPass = new models.PasswordReset({
                    reset_key: reset_key,
                    user_id: user._id,
                    date: new Date()
                }).save(function (err, entry) {
                    mailer.mailResetKey(domain, ip, user_cookie, name, reset_key);
                    return fn(null, reset_key);
                });
            });
        } else {
            return fn(new Error(config.ERR_RESET_INVALID_DETAILS));
        }
    });
}

function resetPassword(reset_key, new_password, fn) {
    var decryptResetKey = require('./pass').decryptResetKey;
    var user_id = null;
    decryptResetKey(reset_key, function (err, user_id) {
        crypt.hash(new_password, function (err, salt, hash) {
            if (err) throw err;
            var User = models.mongoose.model(config.DB_AUTH_TABLE, models.UserSchema);
            var query = {
                _id: user_id
            };
            var update_to = {
                salt: salt,
                hash: hash
            };
            var query_options = {
                multi: false
            };
            User.update(query, update_to, query_options, function (err, count) {
                if (err) throw err;
                config.logger.info('RESET PASSWORD - USER DOC UPDATED IN DB WITH NEW HASH', {
                    reset_key: reset_key,
                    records_updated: count
                });
                var PasswordReset = models.mongoose.model(config.DB_AUTH_PASSWORD_RESET, models.PasswordResetSchema);
                var query = {
                    reset_key: reset_key
                };
                var to_update = {
                    used: true
                }
                PasswordReset.findOneAndUpdate(query, to_update, {}, function (err, updated_record) {
                    if (err) throw err;
                    config.logger.info('RESET PASSWORD - RESET KEY DOC INVALIDATED IN DB', {
                        reset_key: reset_key
                    });
                    return fn(null, true);
                });
            });
        });
    });
}

function saveFeedback(username, feedback_data, fn) {
    require('./stats').getUserIdFromName(username, function (err, user_id) {
        var feedback = new models.Feedback({
            user_id: user_id,
            feedback_data: feedback_data
        }).save(function (err, saved_data) {
            config.logger.info('FEEDBACK - FORM POST - DATA SAVED IN DB', {
                username: username,
                saved_data: saved_data
            });
        });
    });
}

function getFeedbackData(fn) {
    var query = models.Feedback.find({});
    query.sort({
        date: -1
    });
    query.populate('user_id', 'username');
    query.lean();
    query.exec(function (err, feedback_data) {
        return fn(null, feedback_data);
    });
}

function saveLastSeen(username, fn) {
    require('./stats').getUserIdFromName(username, function (err, user_id) {
        var last_seen = {
            'last_seen': new Date()
        };
        models.User.findByIdAndUpdate(user_id, last_seen, {
            upsert: true
        }, function (err, upserted_record) {
            if (err) return fn(err.message, null);
            return fn(null, upserted_record._id);
        });
    });
}

function getUnreadFeedbackCount(last_seen, fn) {
    var to_find = {
        date: {
            $gte: last_seen
        }
    };
    models.Feedback.count(to_find, function (err, unread_count) {
        unread_count = unread_count || 0;
        return fn(null, unread_count);
    });
}

module.exports = {
    authenticate: authenticate,
    requiredAuthentication: requiredAuthentication,
    requiredAdmin: requiredAdmin,
    isUsernameValid: isUsernameValid,
    userExist: userExist,
    activateUser: activateUser,
    validateResetKey: validateResetKey,
    sendResetKey: sendResetKey,
    resetPassword: resetPassword,
    saveFeedback: saveFeedback,
    getFeedbackData: getFeedbackData,
    saveLastSeen: saveLastSeen,
    getUnreadFeedbackCount: getUnreadFeedbackCount
}