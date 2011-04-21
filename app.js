
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Connections and messages:
var connections = {},
    messages = [];

/* Adds the given message to all of the connection buffers and the main message
 * buffer.
 */
function addMessage(message) {
    for (var connection in connections) {
        if (connections.hasOwnProperty(connection)) {
            connections[connection].push(message);
        }
    }

    messages.push(message);
}

// Configuration

app.configure(function () {
    console.log(__dirname);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

// Routes
app.get("/chat/:username", function (req, res) {
    var username = req.parameters.username;

    if (!(username in connections)) {
        connections[username] = messages;
    }
    
    var connection = connections[username],
        messages = [];

    for (var i = 0; i < connection.length; i++) {
        messages.push(connection[i]);
    }

    connections[username] = [];

    if (messages.length > 0) {
        res.send(JSON.stringify({messages : messages}));
    } else {
        res.send("");
    }
});

app.post("/chat/:username", function (req, res) {
    var username = req.parameters.username,
        message = JSON.parse(req.body);
    
    addMessage(message);
});

app.get('/', function (req, res) {
    res.render('index', {
        title: 'Chat Client Proof-of-Concept'
    });
});

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
}
