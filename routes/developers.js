var express = require('express');

var router = express.Router();


router.get('/developers',function(req,res,next){
    res.render('developers.ejs');
});

router.get('/login', function(req,res,next){
    res.render('signin.ejs');
})

router.get('/register', function(req,res,next){
    res.render('register.ejs');
})

module.exports = router;