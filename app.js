// Set these to change which port of which host the server is listening to:
var PORT = 3000,
    HOST = "127.0.0.1";

if (process.argv && (process.argv.length) > 2 &&
    /\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}/.test(process.argv[2])) {
    HOST = process.argv[2];
}

/**
 * Module dependencies.
 */

var express = require('express'),
    sanitizer = require('sanitizer'),
    fs = require('fs');

var app = module.exports = express.createServer();

// Connections and messages:
var connections = [],
    messages = [],
    nextId = 0;

// The file to log to:
var messageFile = "messages." + HOST,
    messageFileStream = fs.createWriteStream(messageFile, {flags : "a"}),
    messageFileBuffer = [];// Holds the messages that need to be written to file.

// Recover any old messages then start writing to the messages file:
fs.readFile(messageFile, "utf8", function (err, data) {
    data = data.replace(/^,/, "");
    data = '{"data" : [' + data + ']}';
    console.log(data);
    data = JSON.parse(data).data;
    messages = data;
    setTimeout(flushBuffer, 1000);
});

/* Writes all the messages in the file buffer to the messages file. */
function flushBuffer() {
    if (messageFileBuffer.length > 0) {
        var toWrite = messageFileBuffer.join(",\n");
        messageFileBuffer = [];
        messageFileStream.write(",\n" + toWrite);
    }
    
    setTimeout(flushBuffer, 1000);
}

/* Saves the given message to the message file. */
function writeMessage(message) {
    messageFileBuffer.push(JSON.stringify(message));
}

/* Adds the given message to all of the connection buffers and the main message
 * buffer, removing all unsafe html tags.
 */
function addMessage(message) {
    message.username = sanitizer.sanitize(message.username);
    if (/^\s*$/.test(message.username)) {
        message.username = "Anonymous";
    }
    message.message = sanitizer.sanitize(message.message);
    message.time = new Date();

    for (var connection in connections) {
        if (connections.hasOwnProperty(connection)) {
            connections[connection].push(message);
        }
    }

    messages.push(message);
    writeMessage(message);
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
    console.log("Express server listening on", app.address().address + ":" +
               app.address().port);
}
