var express = require('express');
var connection = require('./database');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var cookieParser = require('cookie-parser')
var session = require('express-session');

var app = express();

app.get('/viewMoreAdminPoll/:parameters',function(req, res){
    //res.render('viewMoreAdminPoll.ejs');
    timeOfContest = req.params.parameters.slice(0,1);
    uniqueId = req.params.parameters.slice(2,req.params.parameters.length);
    var participantsTable = "`Participants" + uniqueId + "`";
    var candidateTable = "`Candidates" + uniqueId + "`";
    var query = "SELECT c.NAME,COUNT(p.VOTED_FOR) COUNT FROM "+candidateTable+" c LEFT OUTER JOIN "+participantsTable+" p on c.ID=p.VOTED_FOR GROUP BY c.NAME";
	connection.query(query,function(error,row,col){
		if(error) {
			console.log("err while calculating votes..");
			return res.send("err while calculating votes..");
        }
        res.render("viewMoreAdminPoll.ejs",{data : row, present : timeOfContest});
   });
});



module.exports = app;