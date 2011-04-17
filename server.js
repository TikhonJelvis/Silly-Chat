var http = require("http"),
    url = require("url");

// Data records:
var data = [];

http.createServer(function (request, response) {
    var requestUrl = url.parse(request.url),
         query = requestUrl.query;

    if (typeof query != "undefined") {
        query = query.split(/\?/);

        var dataObject = {
            toString : function () {
                var string = "{\n";
                
                for (var key in this) {
                    if (this.hasOwnProperty(key) &&
                        typeof this[key] == "string") {
                        string += '"' + key + '"' + " : " + '"' + this[key] +
                            '"\n';
                    }
                }

                return string + "}";
            }
        },
            value = [];// The value of each part of the query.

        for (var i = 0; i < query.length; i++) {
            if (/.+=.+/.test(query[i])) {
                value = query[i].split("=");
                dataObject[value[0]] = value[1];
            }
        }

        data.push(dataObject);
    }

    response.writeHead(200, {"Content-type" : "text/plain"});

    var body = "";
    for (var i = 0; i < data.length; i++) {
        body += data[i] + "\n";
    }

    response.end(body);
}).listen(8124, "127.0.0.1");

console.log("Server running at http://127.0.0.1:8124.");