var express = require('express');
var connection = require('./database');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var cookieParser = require('cookie-parser')
var session = require('express-session');
var upload = require('express-fileupload');
var csv = require('csv-parser')
var fs = require('fs')

var app = express();

var present = [];
var past = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
    secret : 'TheFatRat',
    resave : false,
    saveUninitialized : true,
    cookie :{maxAge : 60000}
}));
app.use(upload());

//for logging in as admin

app.get('/adminDashBoard',function(req,res){
    var query = "CREATE TABLE IF NOT EXISTS HOSTEDCONTEST (SLNO INT AUTO_INCREMENT PRIMARY KEY, ELECTIONNAME VARCHAR(30), DESCRIPTION VARCHAR(200), CURRENT TINYINT(1), UNIQUEID VARCHAR(30) UNIQUE NOT NULL,ADMINID VARCHAR(30))"
    connection.query(query);
    //for clearing cache
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0, expires=0');
    var adminToken = req.cookies.adminToken;
    if(adminToken){
        jwt.verify(adminToken, 'superSecretText', function(error,decoded){
            if(error){
               res.redirect("admin");
            } else {
                query = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = '1'";
                connection.query(query,function(error, rows1, cols1){
                    query1 = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = '0'";
                    connection.query(query1,function(error,rows2,cols2){
                        
                        present = [];
                        past = [];
                        if(rows1.length != 0){
                            rows1.forEach(element => {
                                present.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                            });
                        }
                        if(rows2.length != 0){
                            rows2.forEach(element => {
                                past.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                            });
                        }
                        //* changing this part to insert view more functionality

                        // *data retrived for view more
                        res.render("adminDashBoard.ejs",{name : decoded.ADMINID, presentlyHosted : present, pastHosted : past});
                    });
                });
            }
        });
    } else {
        /*res.status(403).send({
            "error": true,
            "message": 'No token provided.'
        });
        */
       res.redirect('admin');
    }

});


app.post('/adminDashBoard',function(req,res){
    connection.query("CREATE TABLE IF NOT EXISTS ADMINTABLE (SLNO INT AUTO_INCREMENT PRIMARY KEY, ADMINID VARCHAR(30) UNIQUE NOT NULL, PHNO VARCHAR(12) UNIQUE NOT NULL, PASSWORD VARCHAR(70) NOT NULL)");
    if(req.body.AdminId.toString().length === 0 || req.body.password.toString() === 0){
        res.redirect('admin');
    } else{
        var query = "CREATE TABLE IF NOT EXISTS HOSTEDCONTEST (SLNO INT AUTO_INCREMENT PRIMARY KEY, ELECTIONNAME VARCHAR(30), DESCRIPTION VARCHAR(200), CURRENT TINYINT(1), UNIQUEID VARCHAR(30) UNIQUE NOT NULL,ADMINID VARCHAR(30))"
        connection.query(query);
        
        var adminId = req.body.AdminId.toString();
        var password = req.body.password.toString();
        var query = "SELECT * FROM ADMINTABLE WHERE ADMINID = '"+adminId+"'";
        connection.query(query,function(error, rows, cols){
            if(rows.length === 0){
                res.redirect('admin');
            } else if(bcrypt.compareSync(password, rows[0].PASSWORD)){
                var adminIdLoggedIn = JSON.parse(JSON.stringify(rows[0]));
                var adminLoginCookieToken = jwt.sign(adminIdLoggedIn,'superSecretText', {expiresIn : 1440} );
                console.log(rows[0].ADMINID);
                res.cookie('adminToken', adminLoginCookieToken.toString(), { httpOnly: true });
                query = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+rows[0].ADMINID+"' AND CURRENT = '1'";
                connection.query(query,function(error, rows1, cols1){
                    query1 = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+rows[0].ADMINID+"' AND CURRENT = '0'";
                    connection.query(query1,function(error,rows2,cols2){
                        
                        present = [];
                        past = [];
                        if(rows1.length != 0){
                            rows1.forEach(element => {
                                present.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                            });
                        }
                        if(rows2.length != 0){
                            rows2.forEach(element => {
                                past.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                            });
                        }

                        res.render("adminDashBoard.ejs",{name : rows[0].ADMINID, presentlyHosted : present, pastHosted : past});
                    });
                });
                
            } else {
                res.redirect('admin');
            }
        });
    }

});

//for admin logout

app.post('/adminLogout', function(req,res){
    res.clearCookie('adminToken');
    res.render('LogoutPage.ejs');
});

//for hosting an ELection

app.post('/hostElection', function(req, res){
    var electionName = req.body.electionName;
    var uniqueId = req.body.uniqueId;
    var description = req.body.description;
    var current = "1";
    

    var query = "CREATE TABLE IF NOT EXISTS HOSTEDCONTEST (SLNO INT AUTO_INCREMENT PRIMARY KEY, ELECTIONNAME VARCHAR(30), DESCRIPTION VARCHAR(200), CURRENT TINYINT(1), UNIQUEID VARCHAR(30) UNIQUE NOT NULL,ADMINID VARCHAR(30))"
    connection.query(query);

    var adminToken = req.cookies.adminToken;
    jwt.verify(adminToken, 'superSecretText', function(error,decoded){
        if(error){
           res.redirect("admin");
        } else if(uniqueId.toString().split(" ").length != 1){
            query = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 1";
            connection.query(query,function(error, rows1, cols){
                query1 = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 0";
                connection.query(query1,function(error,rows2,cols1){
                    present = [];
                    past = [];
                    if(rows1.length != 0){
                        rows1.forEach(element => {
                            present.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                        });
                    }
                    if(rows2.length != 0){
                        rows2.forEach(element => {
                            past.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                            
                        });
                    }
                    res.render("adminDashBoard.ejs",{name : adminId, presentlyHosted : present, pastHosted : past});
                });
            }); 
            
            // check for if the csv file format and cols are all okay is not implemented
        } else if(req.files && electionName && electionName.length !== 0 && uniqueId !== 0){
            var adminId = decoded.ADMINID;
            var file = req.files.uploadedFile;
            var fileName = uniqueId + "_Authenticated_Users.csv";
            file.mv("./uploaded/"+fileName);
            
            query = "CREATE TABLE IF NOT EXISTS " + uniqueId + "_Authenticated_Users (PARTICIPANTNAME VARCHAR(30) PRIMARY KEY)";
            connection.query(query);
            //for creating participants table for admin during hosting contest
            var table = "`Participants" + uniqueId + "`";
	        query = "CREATE TABLE IF NOT EXISTS "+table+" (SLNO INT AUTO_INCREMENT PRIMARY KEY, NAME VARCHAR(100) UNIQUE, PHONE VARCHAR(10) UNIQUE, EMAIL VARCHAR(300) UNIQUE, PASSWORD VARCHAR(300), VOTED_FOR INT,OTP INT, CONFIRM BOOLEAN)";
            connection.query(query);
            //for creating candidates table for admin during hosting contest
            var table1 = "`Candidates" + uniqueId + "`";
		    query = "CREATE TABLE IF NOT EXISTS "+table1+" (ID INT AUTO_INCREMENT PRIMARY KEY, NAME VARCHAR(30) UNIQUE, DESCRIPTION TEXT)";
        	//participate as voter
        	connection.query(query,function(err,result,col){
        		if(err){
        			console.log("Internal error..");
        			return res.send("Error creating candidate table..");
        		}
		});
            names = []

            fs.createReadStream("./uploaded/"+fileName)  //no try catch implemented
            .pipe(csv())
            .on('data', (data) =>{
                query = "INSERT INTO " + uniqueId + "_Authenticated_Users (PARTICIPANTNAME) VALUES ('"+data.Name+"')";
                //console.log(query);
                connection.query(query);
            })
            .on('end', () => {});
            

            query = "INSERT INTO HOSTEDCONTEST (ELECTIONNAME, DESCRIPTION, CURRENT, UNIQUEID, ADMINID) VALUES ('"+electionName+"','"+description+"','"+current+"','"+uniqueId+"','"+adminId+"')";
            connection.query(query,function(err, rows, c){
                if(!err){
                    query = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 1";
                    connection.query(query,function(error, rows1, cols){
                        query1 = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 0";
                        connection.query(query1,function(error,rows2,cols1){

                            present = [];
                            past = [];
                            if(rows1.length != 0){
                                rows1.forEach(element => {
                                    present.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                    
                                });
                            }
                            if(rows2.length != 0){
                                rows2.forEach(element => {
                                    past.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                                });
                            }

                            res.render("adminDashBoard.ejs",{name : adminId, presentlyHosted : present, pastHosted : past});
                        });
                    });
                } else {
                    query = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 1";
                    connection.query(query,function(error, rows1, cols){
                        query1 = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 0";
                        connection.query(query1,function(error,rows2,cols1){

                            present = [];
                            past = [];
                            if(rows1.length != 0){
                                rows1.forEach(element => {
                                    present.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                    
                                });
                            }
                            if(rows2.length != 0){
                                rows2.forEach(element => {
                                    past.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                                });
                            }

                            res.render("adminDashBoard.ejs",{name : adminId, presentlyHosted : present, pastHosted : past});
                        });
                    });
                }
            });
        } else {
            query = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 1";
            connection.query(query,function(error, rows1, cols){
                query1 = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 0";
                connection.query(query1,function(error,rows2,cols1){
                    present = [];
                    past = [];
                    if(rows1.length != 0){
                        rows1.forEach(element => {
                            present.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                                
                        });
                    }
                    if(rows2.length != 0){
                        rows2.forEach(element => {
                            past.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                            
                        });
                    }
                    res.render("adminDashBoard.ejs",{name : adminId, presentlyHosted : present, pastHosted : past});
                });
            });
        }   
    });
    

});


//for ending a previously hosted election


app.post('/endElection', function(req, res){
    var uniqueId = req.body.uniqueId;

    var query = "CREATE TABLE IF NOT EXISTS HOSTEDCONTEST (SLNO INT AUTO_INCREMENT PRIMARY KEY, ELECTIONNAME VARCHAR(30), DESCRIPTION VARCHAR(200), CURRENT TINYINT(1), UNIQUEID VARCHAR(30) UNIQUE NOT NULL,ADMINID VARCHAR(30))"
    connection.query(query);

    var adminToken = req.cookies.adminToken;
    jwt.verify(adminToken, 'superSecretText', function(error,decoded){
        if(error){
            res.render('admin.ejs')
        } else {
            query = "UPDATE HOSTEDCONTEST SET CURRENT = '0' WHERE UNIQUEID = '"+uniqueId+"'";
            connection.query(query);
            query = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 1";
            connection.query(query,function(error, rows1, cols){
                query1 = "SELECT * FROM HOSTEDCONTEST WHERE ADMINID = '"+decoded.ADMINID+"' AND CURRENT = 0";
                connection.query(query1,function(error,rows2,cols1){

                    present = [];
                    past = [];
                    if(rows1.length != 0){
                        rows1.forEach(element => {
                            present.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                            
                        });
                    }
                    if(rows2.length != 0){
                        rows2.forEach(element => {
                            past.push([element.ELECTIONNAME, element.DESCRIPTION, element.UNIQUEID]);
                    
                        });
                    }

                    res.render("adminDashBoard.ejs",{name : decoded.ADMINID, presentlyHosted : present, pastHosted : past});
                });
            });

        }
    });
});


//for uploading a csv file



module.exports = app;
