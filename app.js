var express = require('express'),
    http = require('http'),
    bodyparser = require('body-parser'),
    methodoverride = require('method-override'),
    cookieparser = require('cookie-parser'),
    session = require('express-session'),
    morgan = require('morgan'),
    path = require('path'),
    swig = require('swig'),
    mongoose = require('mongoose'),
    mongostore = require('connect-mongo')(session),
    config = require('./config/config');

var app = express();

app.use(morgan('dev'));
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json({
    extended: true
}));
app.use(cookieparser(config.APP_TITLE));
app.use(session({
    secret: config.MASTER_SALT,
    store: new mongostore({
        url: config.DB_MONGO_CONNECT_STRING,
        cookie: {
            maxAge: 86400
        },
        collection: config.DB_AUTH_SESSIONS,
        auto_reconnect: true
    })
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/stylesheets')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'swig');
swig.setDefaults({
    autoescape: false
});
app.engine('.html', swig.renderFile);

require('./routes/middleware')(app);
require('./routes/basic')(app);
if (!config.AUTH_USE_LDAP) require('./routes/user')(app);
require('./routes/quiz')(app);
require('./routes/admin')(app);
require('./routes/errors')(app);

app.listen(config.APP_PORT, function () {
    config.logger.info('START - NodeJS Express server started listening on port [' + config.APP_PORT + ']');
});