// Set these to change which port of which host the server is listening to:
var PORT = 3000,
    HOST = "127.0.0.1";

if (process.argv && (process.argv.length) > 2) {
    HOST = process.argv[2];
}

/**
 * Module dependencies.
 */

var express = require('express'),
    chat = require('./chat');

var app = module.exports = express.createServer(),
    chatServer = chat.createServer(HOST);

// Configuration

app.configure(function () {
    console .log(__dirname);
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
    res.send({id : chatServer.nextId()});
});

app.get("/chat/:id", function (req, res) {
    chatServer.provideResponse(req.params.id, res);
});

app.post("/chat/:id", function (req, res) {
    chatServer.addMessage(req.body, req.params.id);
    res.send("");
});

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(PORT, HOST);
    console.log("Express server listening on", app.address().address + ":" +
               app.address().port);
}
