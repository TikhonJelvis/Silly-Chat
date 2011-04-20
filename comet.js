/* This will be rewritten completely! */
var http = require("http"),
    fs = require("fs"),
    url = require("url"),
    path = require("path");

// The users and messages:
var users = [],
    messages = [{name : "Bob", message : "Hello World!"}];

http.createServer(function (request, response) {
    var requestUrl = url.parse(request.url, true),
        reqPath = requestUrl.pathname;

    if (reqPath && path.basename(reqPath) == "messages") {
        console.log(request, requestUrl);
        var query = requestUrl.query,
            message = {
                name : query.name,
                message : query.message
            },
            userResponse = getResponse(message.name);

        addMessage(message);
        
        response.writeHead("200", {"Content-type" : "text"});
        response.end(userResponse);
    } else if (reqPath) {
        read(reqPath);
    } else {
        read("test.html");
    }

    /* Adds the given message to all of the existing users and the overall
     * messages queue.
     */
    function addMessage(message) {
        message = JSON.stringify(message);
        messages.push(message);
        
        for (var user in users) {
            if (users.hasOwnProperty(user)) {
                users[user].push(message);
            }
        }
    }

    /* Returns all of the messages to send to the given user and empties that
     * user's queue.
     */
    function getResponse(user) {
        if (user in users) {
            var response = users[user];
            users[user] = [];
            return JSON.stringify({messages : response});
        } else {
            users[user] = [];
            return JSON.stringify({messages : messages});
        }
    }

    /* Responds with the file at the given file path. */
    function read(filePath) {
        filePath = path.normalize("/home/tikhon/Documents/programming/" +
                                  "javascript/node/" + filePath);
        
        if (fs.lstatSync(filePath).isDirectory()) {
            read("test.html");
            return;
        }
        
        fs.readFile(filePath, function (error, data) {
            if (error) {
                console.log(error);
                response.writeHead("404", {"Content-type" : "text"});
                response.end("Horribe error: \n" + error);
            } else {                
                var extention = path.extname(filePath),
                    type = (function () {
                        switch (extention) {
                        case "html": return "text/html";
                        case "js" : return "application/javascript";
                        default: return "text";
                        }
                    })();

                response.writeHead("200", {"Content-type" : type});
                response.end(data);
            }
        });
    }
}).listen(8124, "127.0.0.1");

console.log("Running comet(y) server on 127.0.0.1:8124!");