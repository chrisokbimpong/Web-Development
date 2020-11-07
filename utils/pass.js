var crypto = require('crypto'),
    hashids = require('hashids'),
    config = require('../config/config');

var hash = function (pwd, salt, fn) {
    var len = 128;
    var iterations = 12000;
    if (3 == arguments.length) {
        crypto.pbkdf2(pwd, salt, iterations, len, null, fn);
    } else {
        fn = salt;
        crypto.randomBytes(len, function (err, salt) {
            if (err) return fn(err);
            salt = salt.toString('base64');
            crypto.pbkdf2(pwd, salt, iterations, len, null, function (err, hash) {
                if (err) return fn(err);
                fn(null, salt, hash);
            });
        });
    }
};

var encrypt = function (mongo_id, fn) {
    try {
        var hashid = new hashids(config.MASTER_SALT);
        fn(null, hashid.encryptHex(mongo_id.toString()));
    } catch (err) {
        fn(err, null);
    }
};

var decrypt = function (hash_value, fn) {
    try {
        var hashid = new hashids(config.MASTER_SALT);
        fn(null, hashid.decryptHex(hash_value.toString()));
    } catch (err) {
        fn(err, null);
    }
};

var generateResetKey = function (user_id, fn) {
    try {
        var hashid = new hashids(config.RESET_PASSWORD_SALT);
        fn(null, hashid.encryptHex(user_id.toString() + '0'));
    } catch (err) {
        fn(err, null);
    }
};

var decryptResetKey = function (reset_key, fn) {
    try {
        var hashid = new hashids(config.RESET_PASSWORD_SALT);
        var decrypted_string = hashid.decryptHex(reset_key.toString());
        fn(null, decrypted_string.slice(0, decrypted_string.length - 1));
    } catch (err) {
        fn(err, null);
    }
}

module.exports = {
    hash: hash,
    encrypt: encrypt,
    decrypt: decrypt,
    generateResetKey: generateResetKey,
    decryptResetKey: decryptResetKey
}