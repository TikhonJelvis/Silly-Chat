(function () {
    // IMPORTS
    var sanitizer = require('sanitizer'),
        fs = require('fs');

    // EXPORTS
    /**
     * Returns a new chat server. An optional id parameter may be passed in; this
     * will be used to identify the given server's message file.
     *
     * @param {String} [id] an optional id used to tag the server's message file.
     */
    exports.createServer = function (id) {
        return new Server(id);
    };

    /**
     * Represets a chat server which keeps track of discrete connections and
     * sends messages appropriately. The id parameter should be different for
     * different servers--it determines to which file messages are saved and
     * where messages are read from.
     *
     * @constructor
     * @param {String} [id] an optional id used to tag the server's message file.
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

        /**
         * Returns the next connection id.
         *
         * @function
         * @memberOf Server
         * @return {int} the id for the next connection to this server.
         */
        this.nextId = function () {
            return nextId++;
        };

        /**
         * Provides a response to the given id. Look at
         * Connection.provideResponse for more details.
         *
         * @function
         * @memberOf Server
         * @param {int} id the id of the connection to provide the response to.
         * @param {HTTPResponse} response the response to provide.
         * @see Connection.provideResponse
         */
        this.provideResponse = function (id, response) {
            if (!(id in connections)) {
                connections[id] = new Connection();
            }

            connections[id].provideResponse(response);
        };

        /**
         * Adds the given message to the sever. This causes all currently
         * provided responses to be sent out.
         *
         * @function
         * @memberOf Server
         * @param {Message} message the message to add to this server.
         * @param {int} id the id of the user that submitted the message.
         */
        this.addMessage = function (message, id) {
            message.username = sanitizer.sanitize(message.username);
            if (/^\s*$/.test(message.username)) {
                message.username = "Anonymous";
            }
            message.message = sanitizer.sanitize(message.message);
            message.time = new Date();
            message.id = id;

            for (var connection in connections) {
                if (connections.hasOwnProperty(connection)) {
                    connections[connection].addMessage(message);
                }
            }

            messages.push(message);
            writeMessage(message);
        };

        /**
         * Writes all the messages in the file buffer to the messages file.
         *
         * @function
         */
        function flushBuffer() {
            if (messageFileBuffer.length > 0) {
                var toWrite = messageFileBuffer.join(",\n");
                messageFileBuffer = [];
                messageFileStream.write(",\n" + toWrite);
            }
            
            setTimeout(flushBuffer, 1000);
        }
        
        /**
         * Saves the given message to the message file.
         *
         * @function
         * @param {Message} message the message to save. This message will be
         *  serialized to JSON and written to this server's message file.
         */
        function writeMessage(message) {
            messageFileBuffer.push(JSON.stringify(message));
        }
        
        /**
         * Represents a connection to a particular client. A set of messages to
         * send may be provided. This object will either buffer up messages that
         * need to be sent or hold onto a connection in the form of an
         * HTTPRequest.
         *
         * If this is holding a connection and a new message arrives, the
         * connection will be immediately ended with the message as the response.
         * If this is not holding a connection when a new message arrives, the
         * message is stored in a buffer. When this finally gets a new connection
         * from the client, that connection is immediately sent back with all of
         * the buffered messages in the body and the buffer is cleared.
         *
         * In order to improve performance of the connection during periods of
         * little activity on the server, this class also takes an optional
         * timeout argument. If this is supplied, then any connection held longer
         * than the specified time will be returned back with an empty array of
         * messages in the response. If a timeout is not presented, it is set to
         * 50000 milliseconds.
         *
         * @constructor
         * @param {int} [timeout=50000] how often to end the held connection to
         *  get a new one.
         */
        function Connection(timeout) {
            var messageBuffer = [],// Any messages waiting to be sent.
                response = null,// The response to write to.
                renewTimeout = null;
            
            timeout = timeout || 50000;// The default timeout is fifty seconds.
            
            messageBuffer = messageBuffer.concat(messages);

            /**
             * If there is a held connection, sends it off to get a new one.
             * this stops the client from timing out.
             *
             * @function
             */
            function renew() {
                if (response) {
                    response.send({messages : []});
                    response = null;
                }
            }

            /**
             * If there is a response, sends the given object to it. Otherwise,
             * does nothing.
             *
             * @function
             * @param {Message} message the message to try to send.
             */
            function send(message) {
                if (response) {
                    response.send(message);
                    response = null;
                    clearTimeout(renewTimeout);
                    renewTimeout = null;
                }
            }

            /**
             * Either sends a message (if a connection is currently held) or
             * buffers it up for the next connection (if no connection is held).
             *
             * @function
             * @memberOf Connection
             * @param {Message} message the message ot send.
             */
            this.addMessage = function (message) {
                response ?
                    send({messages : [message]}) : messageBuffer.push(message);
            };

            /**
             * Provides the response to use as soon as any new information comes
             * in.
             *
             * @function
             * @memberOf Connection
             * @param {HTTPResponse} newResponse the new response to hold.
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
