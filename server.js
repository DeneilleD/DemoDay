// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
const MongoClient = require('mongodb').MongoClient
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var ObjectId = require('mongodb').ObjectId
var multer = require('multer')


var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

var db
var path = require('path')
const twilio = require('twilio');
const accountSid = 'AC9e5d1d413296c0f29ae8ebd56dd5f96f'; // Your Account SID from www.twilio.com/console
const authToken = '976088d76668af8470b1b0c9c3e0862e'; // Your Auth Token from www.twilio.com/console
const client = new twilio('AC9e5d1d413296c0f29ae8ebd56dd5f96f', '976088d76668af8470b1b0c9c3e0862e');

client.messages
  .create({
    body: 'Hello from Node',
    to: 'req.user.local.phone', // Text this number
    from: '+13163955977', // From a valid Twilio number
  })
  .then((message) => console.log(message.sid));


// configuration ===============================================================
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(configDB.url, (err, database) => {
  if (err) return console.log(err)
  db = database
  require('./app/routes.js')(app, passport, db, multer, ObjectId);
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'rcbootcamp2021b', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
