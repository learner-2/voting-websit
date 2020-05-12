var express = require('express');
var connection = require('./database');

var router = express.Router();

/*
    R = select ElectionName, uniqueId from hostedcontest where current ==0 DESC start date

    for each uiniqueId in R:
        V = select count(name) from Participants+uniqueID group by VotedFor

*/

router.post('/previousResults',function(req,res,next){
    var query = "CREATE TABLE IF NOT EXISTS HOSTEDCONTEST (SLNO INT AUTO_INCREMENT PRIMARY KEY, ELECTIONNAME VARCHAR(30), DESCRIPTION VARCHAR(200), CURRENT TINYINT(1), UNIQUEID VARCHAR(30) UNIQUE NOT NULL,ADMINID VARCHAR(30))";
    connection.query(query);
    query = "SELECT * FRoM HOSTEDCONTEST WHERE CURRENT = 0";
    connection.query(query, function(error, rows, cols){
        if(error){
            return res.send("Error");
        }
        res.render("previousResults.ejs", {data : rows});
    });
});


router.get('/previousResults',function(req,res,next){
    var query = "CREATE TABLE IF NOT EXISTS HOSTEDCONTEST (SLNO INT AUTO_INCREMENT PRIMARY KEY, ELECTIONNAME VARCHAR(30), DESCRIPTION VARCHAR(200), CURRENT TINYINT(1), UNIQUEID VARCHAR(30) UNIQUE NOT NULL,ADMINID VARCHAR(30))";
    connection.query(query);
    query = "SELECT * FRoM HOSTEDCONTEST WHERE CURRENT = 0";
    connection.query(query, function(error, rows, cols){
        if(error){
            return res.send("Error");
        }
        res.render("previousResults.ejs", {data : rows});
    });
});

router.post("/viewStats/:uid", function(req,res,next){
    var table = "`Participants" + req.params.uid + "`";
    var table1 = "`Candidates" + req.params.uid + "`";
    var qrs = "SELECT c.NAME,COUNT(p.VOTED_FOR) COUNT FROM "+table1+" c LEFT OUTER JOIN "+table+" p on c.ID=p.VOTED_FOR GROUP BY c.NAME";
	connection.query(qrs,function(err,row,col){
		if(err)
			{
				console.log("err while calculating votes..");
				return res.send("err while calculating votes..");
            }
        res.render("viewStats.ejs",{data:row});
   });
});

module.exports = router;