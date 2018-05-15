let express = require('express');

let app = express();

app.use(express.static('build'));

var server = app.listen(9081, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Divisions API http://%s:%s", host, port)
 })