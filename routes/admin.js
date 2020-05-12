var express = require('express');
var bodyParser = require('body-parser');
var connection = require('./database');
var bcrypt = require('bcryptjs');

var router = express();


router.use(bodyParser.urlencoded({extended: false}));

//for getting to the admin page

router.get('/adminLogin', function(req,res,next){
    res.render('adminLogin.ejs');
});
router.get('/adminRegister', function(req,res,next){
    res.render('adminRegister.ejs');
});

router.post('/admin', function(req,res,next){
    res.render('adminLogin.ejs');
});


//for registering as admin

router.post('/adminRegister',function(req,res){
    connection.query("CREATE TABLE IF NOT EXISTS ADMINTABLE (SLNO INT AUTO_INCREMENT PRIMARY KEY, ADMINID VARCHAR(30) UNIQUE NOT NULL, PHNO VARCHAR(12) UNIQUE NOT NULL, PASSWORD VARCHAR(70) NOT NULL)");
    if(req.body.password != req.body.retypepassword || req.body.password.toString().length === 0){
        res.render('adminRegister.ejs');
    } else{
        var hashedPassword = bcrypt.hashSync(req.body.password, 10);
        var query = "INSERT INTO ADMINTABLE (ADMINID, PHNO, PASSWORD) VALUES ('"+req.body.AdminId+"', "+"'"+req.body.phoneNo+"', "+"'"+hashedPassword+"')";
        connection.query(query,function(error,rows,cols){
            if(error){
                res.render('adminRegister.ejs');
            }
        });
        res.render('adminRegister.ejs');
    }
});


module.exports = router;