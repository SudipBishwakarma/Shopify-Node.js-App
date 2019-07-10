const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport')
const fileUpload = require('express-fileupload')
const Shop = mongoose.model('Shop');
// Routes
const index = require('./routes/index');
const webhook = require('./routes/webhook');
const proxy = require('./routes/proxy');
const api = require('./routes/api');
const shopifyAuth = require('./routes/shopify')
const harmonizedCode = require('./routes/hs.js')

global.__basedir = __dirname //Setting global app base dir to use on other modules

//PassportJs
passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser((_id, done) => {
  Shop.findById(_id).exec()
  .then(data => {
      return done(null, data)
  })
  .catch(err => done(err, false))
})

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);
app.use(session({
  name: '_App',
  secret: process.env.SESSION_SECRET || 'ashdaefoinvweofwv!#3',
  cookie: { maxAge: (30 * 24 * 60 * 60 * 1000) },
  saveUninitialized: true,
  resave: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
// Routes
app.use('/', index);
app.use('/hs', harmonizedCode);
app.use('/webhook', webhook);
app.use('/proxy', proxy);
app.use('/api', api);
app.use('/auth', shopifyAuth)
// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)

  if (req.app.get('env') === 'development') {
    return res.render('error')
  } else {
    return res.send('Something went wrong')
  }
})

module.exports = app
