require('dotenv').config();
var fs = require('fs');
var express = require('express');
var app = express();
//var http = require('http').Server(app);
var https = require('https');

var search = require("./search");


process.on('uncaughtException', function (err) {
  console.log(err);
});






var options = {
    key: fs.readFileSync('./ssl/privkey.pem'),
    cert: fs.readFileSync('./ssl/cert.pem'),
    ca: fs.readFileSync('./ssl/fullchain.pem'),
};

/*http.listen(3000, function(){
  console.log('listening on *:3000');
});*/

var server = https.createServer(options, app);
var io = require('socket.io')(server);

app.use('/', express.static(__dirname + '/public'));

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('search', function(latLng){
    console.log('search: ' + latLng.lat + ", "+ latLng.lng);
    search(latLng.lat, latLng.lng, function(cells, finish){
    	//console.log(cells)
    	socket.emit("search-results", cells, finish);
    });

  });

});

server.listen(3000, function(){
  console.log("Express server listening on port :" + 3000);
});
