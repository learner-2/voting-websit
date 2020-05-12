const express = require('express');
var bodyParser = require('body-parser');
var connection = require('./database');
var bcrypt = require('bcryptjs');
var Nexmo = require("nexmo");
var jwt = require('jsonwebtoken');
var session = require('express-session');
//var cookieParser = require('cookie-parser');
const router = express.Router();
var fs = require("fs");
var nodemailer = require('nodemailer');
//var upload = require('express-fileupload');
//var multer  = require('multer');
//router.use(upload());
/*var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './tmp')
  },
  filename: function (req, file, cb) {
    cb(null, "temp.jpg")
  }
})
*/
//var upload = multer({storage:storage});
//router.use(bodyParser.json());
//router.use(bodyParser.urlencoded({ extended: true }));

//router.use(upload.single('file'));

var transporter = nodemailer.createTransport({
	service: 'gmail',
	/*secure: false,
	port: 25,*/
	auth: {
		user: 'arkesray@gmail.com',
		pass: 'arkesray4498@!'
		}/*,
	tls: {
		rejectUnauthorized: false
	}*/
});


var nexmo = new Nexmo({
	apiKey : 'c26a272d',
	apiSecret : 'OdhdrRxmHLjVA0XG'
	
},{debug : true});


/*
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true })); 
router.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))
*/

router.get('/participateInElections', function(req,res,next){
	var query = "SELECT ELECTIONNAME,UNIQUEID FROM `HOSTEDCONTEST` WHERE CURRENT = '1'";
	connection.query(query,function(err,result,col){
	res.render("participateInElections.ejs",{list: result});
	});
});

router.get("/Login/:uid",function(req,res){
	res.render("Login.ejs",{id:req.params.uid, name:"Election Name"});
});

router.post("/Login/:uid",function(req,res){
	var table = "`Participants" + req.params.uid + "`";
	
        var sql_ = "SELECT * FROM"+table+" WHERE `NAME`='"+req.body.name+"' and `CONFIRM`=true";
        connection.query(sql_,function(err,result,col){
        	if(err)
        	{
        			console.log("Unable to update");
        			return res.send(" hello error");
        	}
        	if(result.length)
        	{
        		console.log("account confirmed...");
        		var sql = "SELECT * FROM "+table+" WHERE NAME='"+req.body.name+"'";
			var password = req.body.password.toString();
			connection.query(sql,function(err,result,col){
				if(err)
				{
					console.log("Internal error");
					return res.send("Internal error");
					
				}
				if(result.length)
				{
					if(bcrypt.compareSync(password, result[0].PASSWORD)){
					var base_key = {"name":result[0].NAME,
							"phone":result[0].PHONE,
							"email":result[0].EMAIL,
							//"password":hpass;
							"uid":req.params.uid
							};
					var token = jwt.sign(base_key,'ssshhh',{expiresIn : 1440});
					res.redirect("/ParticpantDashboard/"+token);
					}
					else
					{
						return res.send("Wrong Details..");
					}
				}
				else
				{
					return res.send("No account of such name!");
				}
			});
        	}
        	else
        	{
        		return res.send("User not authorized..");
        	}
	});
	
	//var hpass = bcrypt.hashSync(req.body.password, 10);
	//(bcrypt.compareSync(password, rows[0].PASSWORD);
	
});

router.get('/Signup/:uid',function(req,res,next){
	res.render("Signup.ejs",{id:req.params.uid, name:"Election Name"});
});

router.post("/Signup/:uid",function(req,res,next){
	var table = "`Participants" + req.params.uid + "`";
	var allowedusers = "`" +req.params.uid+"_Authenticated_Users`";
	var sql = "CREATE TABLE IF NOT EXISTS "+table+" (SLNO INT AUTO_INCREMENT PRIMARY KEY, NAME VARCHAR(100) UNIQUE, PHONE VARCHAR(10) UNIQUE, EMAIL VARCHAR(300) UNIQUE, PASSWORD VARCHAR(300), VOTED_FOR INT,OTP INT, CONFIRM BOOLEAN)";
	connection.query(sql);
	console.log(req.body.name);
	sql = "SELECT * FROM "+allowedusers+" WHERE `PARTICIPANTNAME`='"+req.body.name+"'";
	connection.query(sql,function(err,result,col){
		if(err)
		{
			console.log("Error while verifying..");
			//res.render(req.params.uid);
		}
		if(result.length)
		{
			var hpass = bcrypt.hashSync(req.body.password, 10);
			
			var msg = Math.floor(Math.random()*10000000 + 1);
			
			sql = "INSERT INTO "+table+" (NAME, PHONE, EMAIL, PASSWORD,OTP) VALUES ('"+req.body.name+"',"+req.body.phone+",'"+req.body.email+"','"+hpass+"',"+msg+")";
		connection.query(sql,function(err,result,col){
			if(err)
			{
				console.log("Internal error..");
				console.log(err);
				//res.render(req.params.uid);
			}
			else
			{
				
				var base_key = {"name":req.body.name,
						"phone":req.body.phone,
						"email":req.body.email,
						//"password":hpass;
						"uid":req.params.uid
						};
					//var json_base_key = JSON.parse(JSON.stringify(base_key));
					var token = jwt.sign(base_key,'ssshhh',{expiresIn : 1440});
					//console.log(token);
					//res.cookie('token', token, { httpOnly: true });
				if(req.body.confirm==="otp")
				{
					//var msg = Math.floor(Math.random()*10000000 + 1);
					var number = "+91"+req.body.phone; 
					var text = "Your otp is : "+msg.toString();
					nexmo.message.sendSms(
					'Nexmo', number, text, { type: 'unicode'},
					(error, responseData) =>{
						if(error)
						{
							console.log("error");
						}
					});
					//authentication...;
					//res.render("/Otp");
					console.log("otp sent...")
					res.redirect("/getOtp/"+token);
				}
				else
				{
					var mailOptions = {
					from: 'arkesray@gmail.com',
					to: req.body.email,
					subject: 'Voter Confirmation',
					//text: 'Click on link to confirm your account..',
					html: 'Click on the link to confirm .. <a href=http://localhost:3000/ParticpantDashboard/'+token+'>link</a>'
					}
					res.send("Please check your email to confirm your accout..It may take some time..");
					transporter.sendMail(mailOptions, function(error, info){
  					if (error) 
  					{
					    console.log(error);
				 	} 
					else 
					{
					    console.log('Email sent: ');
					    //console.log(info);
					    
					}
				    });
				}
			}
			});
		}
		else
		{
			console.log("User not authorized..");
		}
		
	});
	
});

router.get("/getOtp/:token",function(req,res){
	var token = req.params.token;
	if(token){
	jwt.verify(token,'ssshhh',function(err,decoded){
	if (err) {
            return res.json({"error": true, "message": 'Failed to authenticate token.' });
        }
        	res.render("OTPVerification.ejs");
	});
	}
	else{
	return res.status(403).send({
        "error": true,
        "message": 'No token provided.'
    	});
	}
	
});

router.post("/getOtp/:token",function(req,res){
	//res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	var token = req.params.token;
	if(token){
	jwt.verify(token,'ssshhh',function(err,decoded){
	if (err) {
            return res.json({"error": true, "message": 'Failed to authenticate token.' });
        }
        req.decoded = decoded;
	});
	//console.log(req.decoded.phone);
	var table = "`Participants" + req.decoded.uid + "`";
	var sql= "SELECT OTP FROM "+table+" WHERE `NAME`='"+req.decoded.name+"' and `PHONE`="+req.decoded.phone+" and `EMAIL`='"+req.decoded.email+"'";
		connection.query(sql,function(err,result,col){
			if(err)
			{
				console.log("Internal error");
			}
			if(result.length>0)
			{
				//console.log(req.body.otp+" "+result[0].OTP);
				if(result[0].OTP==req.body.otp)
				{
					//res.redirect("/ParticpantDashboard/"+req.params.token);
					//res.send("Correct otp");
					var query = "UPDATE "+table+" SET confirm=true WHERE `NAME`='"+req.decoded.name+"' and `PHONE`="+req.decoded.phone+" and `EMAIL`='"+req.decoded.email+"'";
					connection.query(query,function(err,res){
					if(err)
					{
						console.log("Internal error");
					}
					});
					res.redirect("/ParticpantDashboard/"+token);
				}
				else
				{
					res.send("Wrong otp..");
					console.log("Wrong otp");
				}
			}	
			else
			{
				//console.log(result[0].length);
				console.log("Cannot fetch data..");
			}	
		});
	}
	else{
	return res.status(403).send({
        "error": true,
        "message": 'No token provided.'
    	});
	}
});

router.get("/ParticpantDashboard/:token",function(req,res){
	var token = req.params.token;
	if(token){
	jwt.verify(token,'ssshhh',function(err,decoded){
	if (err) {
            return res.json({"error": true, "message": 'Failed to authenticate token.' });
        }
        	var table = "`Participants" + decoded.uid + "`";
        	var sql_ = "UPDATE "+table+" SET CONFIRM=true WHERE `NAME`='"+decoded.name+"' and `PHONE`="+decoded.phone+" and `EMAIL`='"+decoded.email+"'";
        	connection.query(sql_,function(err,result,col){
        		if(err)
        		{
        			console.log("Unable to update");
        			return res.send("error");
        		}
		});
		var table1 = "`Candidates" + decoded.uid + "`";
		var sql = "CREATE TABLE IF NOT EXISTS "+table1+" (ID INT AUTO_INCREMENT PRIMARY KEY, NAME VARCHAR(30) UNIQUE, DESCRIPTION TEXT)";
        	//participate as voter
        	connection.query(sql,function(err,result,col){
        		if(err)
        		{
        			console.log("Internal error..");
        			return res.send("Error creating candidate table..");
        		}
		});
		sql = "SELECT * FROM "+table1+"";
		connection.query(sql,function(err,result,col){
			var msg1 = "No candidate participated..";
			if(err)
			{
				console.log("err fetching data");
				return res.send("Error fetching data");
			}
			if(result.length>0)
			{
				var qrs = "SELECT c.NAME,COUNT(p.VOTED_FOR) COUNT FROM "+table1+" c LEFT OUTER JOIN "+table+" p on c.ID=p.VOTED_FOR GROUP BY c.NAME";
				connection.query(qrs,function(err,res2,col2){
					if(err)
					{
						console.log("err while calculating votes..");
						return res.send("err while calculating votes..");
					}
					var sql2 = "SELECT NAME FROM "+table1+" WHERE `ID` = (SELECT VOTED_FOR FROM "+table+" WHERE `PHONE`="+decoded.phone+")";
					connection.query(sql2,function(err,res3,col3){
						if(err)
						{
							console.log(err);
							return res.send("Error while showing voted for...");
						}
					var sql3 = "SELECT NAME FROM "+table1+" WHERE `NAME` = '"+decoded.name+"'";
					connection.query(sql3,function(err,res4,col4){
						if(err)
						{
							console.log(err);
							return res.send("Error while fetching data..");
						}
						res.render("ParticipantDashboard.ejs",{name: decoded.name, uid: decoded.uid, candidatedetails: result, voteshare: res2, message1: "",votedFor: res3, isCandidate: res4});
					});
						
					});
				});
			}
			else
			{
				res.render("ParticipantDashboard.ejs",{name: decoded.name, uid: decoded.uid, candidatedetails: result, voteshare: "", message1: msg1,votedFor: "",isCandidate: ""});
			}
			});
	});
	}
	else{
	return res.status(403).send({
        "error": true,
        "message": 'No token provided.'
    	});
	}
});

//router.use(upload.single('file'));

router.post("/tem/:uid/:name",function(req,res){
	res.render("registerAsCandidate.ejs",{uid: req.params.uid, name: req.params.name});
});

router.post("/registerAsCandidate/:uid/:name",function(req,res){
	//console.log(req.body.description);
	var dest = "./public/Images/candidateImages/"+req.params.uid+"_"+req.params.name+".jpg";
	req.files.file.mv(dest);
	//var source = "./tmp/temp.jpg";
	//console.log(req.body.file);
	/*fs.copyFile(source , dest, err => {
 		 if (err) return console.error(err)  
 		console.log('success!')
	  });
	*/
	//req.files.foo.mv("./tm/hello1.jpg");
	//console.log(req.files.file.name);
	var table1 = "`Candidates" + req.params.uid + "`";
	var sq = sql = "INSERT INTO "+table1+" (NAME, DESCRIPTION) VALUES ('"+req.params.name+"','"+req.body.description+"')";
	connection.query(sq,function(err,result,col){
		if(err)
		{
			console.log(err);
			return res.send("error while registering..");
		}
	});
	
	var table = "`Participants" + req.params.uid + "`";
	var sql= "SELECT NAME,PHONE,EMAIL FROM "+table+" WHERE `NAME`='"+req.params.name+"'";
	connection.query(sql,function(err,result,col){
		if(err)
		{
			return res.send("error while registering..");
		}
		var base_key = {"name":req.params.name,
				"phone":result[0].PHONE,
				"email":result[0].EMAIL,
				"uid":req.params.uid
				};
		var token = jwt.sign(base_key,'ssshhh',{expiresIn : 1440});
		res.redirect("/ParticpantDashboard/"+token);
	});
});

router.post("/ParticipantLogout",function(req,res){
		res.redirect("/home");
});

router.post("/saveVote/:uid/:name",function(req,res){
	var table = "`Candidates" + req.params.uid + "`";
	var sql = "SELECT ID FROM "+table+" WHERE `NAME`='"+req.body.vote+"'";
	connection.query(sql,function(err,result,col){
		if(err)
		{
			console.log(err);
			return res.send("Error while voting..");
		}
		var table1 = "`Participants" + req.params.uid + "`";
        	var sql_ = "UPDATE "+table1+" SET VOTED_FOR="+result[0].ID+" WHERE `NAME`='"+req.params.name+"'";
        	connection.query(sql_,function(err,result,col){
        		if(err)
        		{
        			console.log(err);
        			return res.send("Unable to update vote");
        		}
		});
	});
	var tab = "`Participants" + req.params.uid + "`";
	//var sq = "SELECT PHONE,EMAIL";
	var sql= "SELECT NAME,PHONE,EMAIL FROM "+tab+" WHERE `NAME`='"+req.params.name+"'";
	connection.query(sql,function(err,result,col){
		if(err)
		{
			console.log(err);
			return res.send("error while voting");
		}
		var base_key = {"name":req.params.name,
				"phone":result[0].PHONE,
				"email":result[0].EMAIL,
				"uid":req.params.uid
				};
		var token = jwt.sign(base_key,'ssshhh',{expiresIn : 1440});
		res.redirect("/ParticpantDashboard/"+token);
	});
});

module.exports = router;
