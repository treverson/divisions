
var http = require('http');
var https = require('https');
let express = require('express');
let fs = require('fs');
let app = express();

let privatekeyPath, certPath;

for(let i = 0; i < process.argv.length -1 ; i++) {
    if(process.argv[i] == "--privatekey"){
        privatekeyPath = process.argv[i + 1];
    } else if(process.argv[i] == "--cert") {
        certPath = process.argv[i + 1];
    }
}



app.use(express.static('build'));

if(privatekeyPath && certPath) {
    let privateKey = fs.readFileSync(privatekeyPath);
    let cert = fs.readFileSync(certPath);
    let credentials = {key: privateKey, cert: cert};

    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(9082);
}

var httpServer = app.listen(9081, function () {
    var host = httpServer.address().address
    var port = httpServer.address().port
    
    console.log("Divisions API http://%s:%s", host, port)
 })