// Set these to change which port of which host the server is listening to:
var PORT = 3000,
    HOST = "169.229.100.61";

/**
 * Module dependencies.
 */

var express = require('express'),
    sanitizer = require('sanitizer');

var app = module.exports = express.createServer();

// Connections and messages:
var connections = [],
    messages = [],
    nextId = 0;

/* Adds the given message to all of the connection buffers and the main message
 * buffer, removing all unsafe html tags.
 */
function addMessage(message) {
    message.username = sanitizer.sanitize(message.username);
    if (/^\s*$/.test(message.username)) {
        message.username = "Anonymous";
    }
    message.message = sanitizer.sanitize(message.message);

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

app.get('/', function (req, res) {
    res.render('index', {
        title: 'Chat Client Proof-of-Concept'
    });
});

app.get("/chat", function (req, res) {
    res.send({id : nextId});
    nextId++;
});

app.get("/chat/:id", function (req, res) {
    var id = req.params.id;

    if (!(id in connections)) {
        connections[id] = messages;
    }
    
    var connection = connections[id],
        messagesToSend = [];

    for (var i = 0; i < connection.length; i++) {
        messagesToSend.push(connection[i]);
    }

    connections[id] = [];

    if (messagesToSend.length > 0) {
        res.send({messages : messagesToSend});
    } else {
        res.send("");
    }
});

app.post("/chat/:id", function (req, res) {
    var id = req.params.id,
        message = req.body;
    
    addMessage(message);
});

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(PORT, HOST);
    console.log("Express server listening on port %d", app.address().port);
}
