/* Represents a message board at the given location. This can be observed for
 * changes and accepts messages to send. It requires a url that connects it to
 * the server. It can also take options; right now the only one is username.
 */
function ChatConnection(url, options) {
    options = options || {};
    var username = options.username || "Anonymous";

    var receivedMessages = [],
        observers = [],
        id = "";// A unique id assigned by the server.

    (function connect() {
        $.ajax({
            type : "GET",
            url : url,
            async : true,
            cache : false,
            timeout : 50000,
            success : function (data) {
                id = data.id;
                pollServer();
            },
            error : function (XMLHttpRequest, textStatus, errorThrown) {
                error(textStatus, errorThrown, "Initial handshake");
            }
        });
    })();

    /* Polls the server for changes, sending off all messages in the message
     * buffer and emptying said buffer.
     */
    function pollServer() {
        $.ajax({
            type : "GET",
            url : url + "/" + id,
            async : true,
            cache : false,
            timeout : 60000,
            success : function (data) {
                if (data) {
                    addServerMessages(data.messages);
                }

                setTimeout(pollServer, 100);
            },
            error : function (XMLHttpRequest, textStatus, errorThrown) {
                error(textStatus, errorThrown, "GET message");
                setTimeout(pollServer, 100);
            }
        });
    }

    /* Adds the given messages from the server. */
    function addServerMessages(messages) {
        var event = {messages : messages};
        receivedMessages.concat(messages);
        fire(event);
    }

    /* Sends an error message to all observers. */
    function error(status, message, request) {
        var event = {error : true,
                     status : status,
                     message : message,
                     request : request
                    };
        fire(event);
    }

    /* Sends the given message to the server. */
    this.sendMessage = function (message) {
        message = {message : message, username : username};

        $.ajax({
            type : "POST",
            url : url + "/" + id,
            async : true,
            cache : false,
            data : message,
            error : function (XMLHttpRequest, textStatus, errorThrown) {
                error(textStatus, errorThrown, "Message POST");
            }
        });
    };

    /* Changes the username to use when sending messages. */
    this.setUsername = function (newUsername) {
        username = newUsername;
    };

    /* Returns the current username. */
    this.getUsername = function () {
        return username;
    };

    /* Returns the unique connection id. */
    this.getId = function () {
        return id;
    };

    /* Returns the url of the chat server. */
    this.getUrl = function () {
        return url;
    };

    /* The given function will be called with a change event whenever the state
     * of the message board changes.
     */
    this.observe = function (observer) {
        observers.push(observer);
    };

    /* Removes the specified observer from the list. If the observer is in the
     * list multiple times, removes every instance of it.
     */    
    function removeObserver(observer) {
        for (var i = 0; i < observers.length; i++) {
            if (observer == observers[i]) {
                observers.splice(i, 1);
                i--;
            }
        }        
    }

    /* Removes the specified observer from the list. If the observer is in the
     * list multiple times, removes every instance of it.
     */
    this.removeObserver = function (observer) {
        removeObserver(observer);
    };

    /* Notifies each of the observers of the given event. */
    function fire(event) {
        for (var i = 0; i < observers.length; i++) {
            try {
                observers[i](event);
            } catch (e) {
                if (console) {
                    console.error("Faulty observer:");
                    console.error(observers[i]);
                    console.log(observers);
                    console.error(e);
                }
            }
        }
    }
}
