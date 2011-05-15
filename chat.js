(function () {
    // IMPORTS
    var sanitizer = require('sanitizer'),
        fs = require('fs');

    // EXPORTS
    /* Returns a new chat server. An optional id parameter may be passed in; this
     * will be used to identify the given server's message file.
     */
    exports.createServer = function (id) {
        return new Server(id);
    };

    /* Represets a chat server which keeps track of discrete connections and
     * sends messages appropriately. The id parameter should be different for
     * different servers--it determines to which file messages are saved and
     * where messages are read from.
     */
    function Server(id) {
        // Connections and messages:
        var connections = [],
            messages = [],
            nextId = 0;

        // Logging:
        var messageFile = "messages." + id,
            messageFileStream = fs.createWriteStream(messageFile, {flags : "a"}),
            messageFileBuffer = [];// Holds the messages that need to be written.

        // Recover any old messages then start writing to the messages file:
        fs.readFile(messageFile, "utf8", function (err, data) {
            if (data) {
                data = data.replace(/^,/, "");
            }
            
            data = '{"data" : [' + data + ']}';
            messages = JSON.parse(data).data;
            setTimeout(flushBuffer, 1000);
        });

        /* Returns the next connection id. */
        this.nextId = function () {
            return nextId++;
        };

        /* Provides a response to the given id. Look at
         * Connection::provideResponse for more details.
         */
        this.provideResponse = function (id, response) {
            if (!(id in connections)) {
                connections[id] = new Connection();
            }

            connections[id].provideResponse(response);
        };

        /* Adds the given message to the sever. This causes all currently
         * provided responses to be sent out.
         */
        this.addMessage = function (message) {
            message.username = sanitizer.sanitize(message.username);
            if (/^\s*$/.test(message.username)) {
                message.username = "Anonymous";
            }
            message.message = sanitizer.sanitize(message.message);
            message.time = new Date();

            for (var connection in connections) {
                if (connections.hasOwnProperty(connection)) {
                    connections[connection].addMessage(message);
                }
            }

            messages.push(message);
            writeMessage(message);
        };

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
        
        /* Represents a connection to a particular client. A set of messages to
         * send may be provided. The optional timeout argument tells the server
         * how often to end the held connection to get a new one.
         */
        function Connection(timeout) {
            var messageBuffer = [],// Any messages waiting to be sent.
                response = null,// The response to write to.
                renewTimeout = null;
            
            timeout = timeout || 50000;// The default timeout is fifty seconds.
            
            messageBuffer = messageBuffer.concat(messages);

            /* If there is a held connection, sends it off to get a new one.
             * this stops the client from timing out.
             */
            function renew() {
                if (response) {
                    response.send({messages : []});
                    response = null;
                }
            }

            /* If there is a response, sends the given object to it. Otherwise,
             * does nothing.
             */
            function send(message) {
                if (response) {
                    response.send(message);
                    response = null;
                    clearTimeout(renewTimeout);
                    renewTimeout = null;
                }
            }

            /* Sends the given message to the given connection. */
            this.addMessage = function (message) {
                response ?
                    send({messages : [message]}) : messageBuffer.push(message);
            };

            /* Provides the response to use as soon as any new information comes
             * in.
             */
            this.provideResponse = function (newResponse) {
                response = newResponse;

                if (response && messageBuffer.length > 0) {
                    send({messages : messageBuffer});
                    messageBuffer = [];
                } else {
                    if (renewTimeout) {
                        clearTimeout(renewTimeout);
                    }
                    
                    renewTimeout = setTimeout(renew, timeout);
                }
            };
        }
    }
})();
