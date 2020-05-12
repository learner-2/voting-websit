var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'fakeroot',
    database: 'mydb'
});

connection.connect(function(error){
    if(error){
        console.log("Error connecting to db...");
    }
    else{
        console.log("Connected to db...");
    }
});

module.exports = connection;
