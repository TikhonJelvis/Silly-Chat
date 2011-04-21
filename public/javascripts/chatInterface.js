function ChatInterface(url, username) {
    // Connection:
    var connection = new ChatConnection(url, username);
    
    // Elements:
    var element = $("<div>").addClass("chat"),
        controls = $("<div>").addClass("controls"),
        input = $("<input>").attr("type", "text"),
        button = $("<button>").html("Go"),
        messages = $("<div>");

    input.submit(send);
    button.click(send);

    controls.append(input).append(button);

    element.append(controls);
    element.append(messages);

    connection.observe(function (event) {
        var messages = event.messages;
        
        for (var i = 0; i < messages.length; i++) {
            addMessage(messages[i].message, messages[i].username);
        }
    });

    /* Sends the message currently entered, clearing the input. */
    function send() {
        connection.sendMessage(input.val());
        input.val("");
    }

    /* Adds the given message to the messages div. */
    function addMessage(text, username) {
        var messageDiv = $("<div>").addClass("message"),
            usernameDiv = $("<div>").addClass("username"),
            contentDiv = $("<div>").addClass("messageText");

        contentDiv.append(text);
        usernameDiv.append(username);

        messageDiv.append(usernameDiv).append(contentDiv);

        messages.append(messageDiv);
    }

    /* Returns the parent div of the chat interface. */
    this.getElement = function () {
        return element;
    };
}

$(function () {
    var chat = new ChatInterface("chat", {username : "Bob"});
    $("body").append(chat.getElement());
});