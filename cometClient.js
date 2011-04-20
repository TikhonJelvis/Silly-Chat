/* Creates a chatboard connected to the server at the given url. */
function MessageBoard (url) {
    // The main structural elements:
    var container = $("<div>"),
        messageDiv = $("<div>"),
        input = $("<input>").attr("type", "text");

    input.submit(function () {
        console.log(input.val());
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        message = input.val();
        pollServer();
    });

    input.change(function () {
        console.log(input.val());
    });

    container.append(input);
    container.append(messageDiv);
    $("body").append(container);

    var message = null,// The message to send to the server.
        timeoutId = null;// The id to clear to stop getting messages.
    
    // Gets the next message from the server:
    function pollServer() {
        conosle.log("Polling");
        $.ajax({
            type : "GET",
            dataType : "json",
            url : url,
            async : true,
            cache : false,
            timeout : 50000,
            data : getMessage() ? "message=" + getMessage() : null,
            success : function (data) {
                console.log("Blarg");
                addMessage(JSON.parse(data));
                setTimeout(getMessage, 100);
            },
            error : function (XMLHttpRequest, textStatus, errorThrown) {
                addMessage({messages : [{name : "Error:", error : true,
                            message : errorThrown}]});
                timeoutId = setTimeout(pollServer, 100);
            }
        });
    };

    /* Returns the messages to send and clears the message buffer. */
    function getMessage() {
        var temp = message;
        message = null;
        return temp;
    }

    /* Wraps the given message in a div and adds it to the container. */
    function addMessage(data) {
        var messages = data.messages;

        function createMessageDiv(message) {
            var div = $("<div>").addClass("message"),
                nameDiv = $("<div>").addClass("name"),
                messageDiv = $("<div>").addClass("text");
            nameDiv.append(message.name);
            messageDiv.append(message.message);
            div.append(nameDiv);
            div.append(messageDiv);
        }
        
        if (messages) {
            for (var i = 0; i < messages.length; i++) {
                var div = createMessageDiv(messages[i]);
                messageDiv.append(div);
            }
        }
    }

    /* Returns the div that contains everything else. */
    this.getContainer = function () {
        return container;
    };
}

$(function () {
    var board = new MessageBoard("http://localhost:8124/messages?name=bob");
});