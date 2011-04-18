// A simple node server that deals with comet connections. What fun!

// Required componenets:
var http = require("http");

// Active connections:
var connections = [];

function update() {
    if (connections.length) {
        connection.forEach(function (c) {
            console.log(JSON.stringify(c));
            c.sendBody("oi\n");
        });
    }

    setTimeout(update, 1000);
}

setTimeout(update, 1000);

http.createServer(function (request, response) {
    if (request.url == "/clock") {
        request.connection.setTimeout(0);
        response.writeHeader(200, {"Content-type" : "text/plain"});
        connections.push(response);
    } else {
        response.writeHeader(404, {"Content-type" : "text/plain"});
        response.end("Not found!");
    }
}).listen(8124, "127.0.0.1");

console.log("Running comet server on 127.0.0.1:8124");