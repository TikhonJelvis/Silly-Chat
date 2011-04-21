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
                console.log("id", id);
                pollServer();
            },
            error : function (XMLHttpRequest, textStatus, errorThrown) {
            }
        });
    })();

    /* Polls the server for changes, sending off all messages in the message
     * buffer and emptying said buffer.
     */
    function pollServer() {
        console.log("Polling");

        $.ajax({
            type : "GET",
            url : url + "/" + id,
            async : true,
            cache : false,
            timeout : 50000,
            success : function (data) {
                if (data) {
                    addServerMessages(data.messages);
                }

                setTimeout(pollServer, 100);
            },
            error : function (XMLHttpRequest, textStatus, errorThrown) {
            }
        });
    }

    /* Adds the given messages from the server. */
    function addServerMessages(messages) {
        var event = {messages : messages};
        receivedMessages.concat(messages);
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
            timeout : 50000,
            data : message,
            error : function (XMLHttpRequest, textStatus, errorThrown) {
            }
        });
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
    this.removeObserver = function (observer) {
        for (var i = 0; i < observers.length; i++) {
            if (observer == observers[i]) {
                observers.splice(i, 1);
                i--;
            }
        }
    };

    /* Notifies each of the observers of the given event. */
    function fire(event) {
        for (var i = 0; i < observers.length; i++) {
            try {
                observers[i](event);
            } catch (e) {
                this.removeObserver(observers[i]);
            }
        }
    }
}
