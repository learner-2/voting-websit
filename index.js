var express = require('express');

//routes

var routesHome = require('./routes/home');
var routesDevelopers = require('./routes/developers');
var routesPreviousResults = require('./routes/PreviousResults');
var routesAdmin = require('./routes/admin');
var routesAdminDashBoard = require('./routes/adminDashBoard');
var routesParticipateInElections = require('./routes/participateInElections');
var routesOTPVerificationPage = require('./routes/OTPVerificationPage');
var routesIDLoggedIn = require('./routes/IDLoggedIn');
var viewMoreAdminPoll = require('./routes/viewMoreAdminPoll');

//routes

var app = express();

app.set('view engine','ejs');

app.listen(3000);

//using routes
app.use(express.static(__dirname + '/public'));

app.use('/',routesHome);
app.use('/',routesDevelopers);
app.use('/',routesPreviousResults);
app.use('/',routesAdmin);
app.use('/',routesAdminDashBoard);
app.use('/',routesParticipateInElections);
//app.use('/',routesOTPVerificationPage);
//app.use('/',routesIDLoggedIn);
app.use('/',viewMoreAdminPoll);
