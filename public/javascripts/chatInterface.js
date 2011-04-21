function ChatInterface(url, options) {
    // Connection:
    var connection = new ChatConnection(url, options);
    
    // Elements:
    var element = $("<div>").addClass("chat"),
        controls = $("<div>").addClass("controls"),
        holder = $("<div>").addClass("holder"),
        input = $("<input>").attr("type", "text").addClass("main"),
        statusBar = $("<div>").addClass("statusBar"),
        messages = $("<div>").addClass("messages");

    $("body").keypress(function (event) {
        if (event.keyCode == 13) {
            send();
        }
    });

    input.submit(send);
    controls.append(input);

    statusBar.append("Username: " + options.username);

    holder.append(statusBar);
    holder.append(controls);

    element.append(holder);
    element.append(messages);

    connection.observe(function (event) {
        var messages = event.messages;
        
        for (var i = 0; i < messages.length; i++) {
            addMessage(messages[i].message, messages[i].username);
        }
    });

    /* Returns the chat interface's main element. */
    this.getElement = function () {
        return element;
    };

    /* Sends the message currently entered, clearing the input. */
    function send() {
        if (input.val()) {
            connection.sendMessage(input.val());
        }
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

        messageDiv.hide();
        messages.append(messageDiv);
        messageDiv.fadeIn();

        input.focus();
        window.scrollBy(0, 1000000000000);
    }
}

$(function () {
    var prompt = $("#prompt input"),
        button = $("#go"),
        chat = null;

    prompt.keypress(function (event) {
        if (event.keyCode == 13) {
            startChat();
        }
    });
    
    button.click(function () {
        startChat();
    });

    function startChat() {
        var username = prompt.val();
        $("body").empty();
        chat = new ChatInterface("chat", {username : username});
        $("body").append(chat.getElement());
        window.scrollBy(0, 10000000);
    }
});