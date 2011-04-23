function ChatInterface(url, options) {
    // Connection:
    var connection = new ChatConnection(url, options),
        commands = {};// All the valid commands.
    
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
        if (event.error) {
            var errorMessage = event.status + " <br /> " + event.message;
            errorMessage(errorMessage);
        } else {
            var messages = event.messages;
            
            for (var i = 0; i < messages.length; i++) {
                addMessage(messages[i].message, messages[i].username);
            }
        }
    });

    // A simple welcome message:
    addMessage("Enter &#92;help for a list of available commands",
               "Welcome " + options.username, "info");

    /* Returns the chat interface's main element. */
    this.getElement = function () {
        return element;
    };

    /* Sends the message currently entered, clearing the input. */
    function send() {
        var message = input.val();

        if (isCommand(message)) {
            execute(message);
        } else if (message) {
            connection.sendMessage(message);
        }
        
        input.val("");
    }

    /* Determines if the given message is a command. Commands start with "/" */
    function isCommand(message) {
        return /^[\\\/].*$/.test(message);
    }

    /* Executes the given command. If the command is not defined, nothing
     * happens.
     */
    function execute(command) {
        command = command.replace(/^[\\\/]/, "");
        var args = command.split(" ");
        command = args.splice(0, 1)[0];
        
        if (!(command in commands)) {
            errorMessage("Command <span class=\"code\">" + command +
                         "</span> does not exist");
            return;
        }
    
        try {
            commands[command].command.apply(this, args);
        } catch (e) {
            errorMessage("Command not valid!<br />" + e);
        }
    }

    /* Adds the given message to the messages div. The optional last argument
     * lets you specify the message type; normal messages do not need a type.
     */
    function addMessage(text, username, type) {
        var messageDiv = $("<div>").addClass("message"),
            usernameDiv = $("<div>").addClass("username"),
            contentDiv = $("<div>").addClass("messageText");

        if (type) {
            messageDiv.addClass(type);
        }

        contentDiv.append(text);
        usernameDiv.append(username);

        messageDiv.append(usernameDiv).append(contentDiv);

        messages.append(messageDiv);
        window.scrollBy(0, 10000);
        input.focus();
    }

    /* Shows the specified error message to the user. */
    function errorMessage(text) {
        addMessage(text, "Error", "error");
    }

    commands = {
        name : {
            command : function () {
                var newName = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    newName += " " + arguments[i];
                }
                if (newName) {
                    connection.setUsername(newName);
                    statusBar.empty();
                    statusBar.append("Username: " + newName);
                } else {
                    errorMessage("Please specify a new name.");
                }
            },
            description : "Lets you change your name."
        },
        help : {
            command : function () {
                var message = $("<div>");

                message.append($("<p>").html("Invoke commands by typing a " +
                                             "slash followed by the command " +
                                             "name and optionally space-" +
                                             "delimitted arguments."));
                message.append($("<p>").html("Commands:"));

                for (command in commands) {
                    if (commands.hasOwnProperty(command) &&
                        commands[command].description) {
                        var div = $("<div>");
                        div.append($("<h1>").html("\\" + command)
                                   .addClass("code"));
                        div.append($("<p>")
                                   .html(commands[command].description));
                        message.append(div);
                    }
                }

                addMessage(message, "Help", "info");
            },
            description : "Lists available commands."
        },
        id : {
            command : function () {
                addMessage(connection.getId(), "Connection ID:", "info");
            },
            description : "Lists your unique connection id."
        },
        about : {
            command : function () {
                var message = $("<span>");
                message.html("A simple chat program written by Tikhon Jelvis " +
                           "using node.js, express.js and other nodejs " +
                           "modules as well as jQuery client-side. Check it " +
                           "out on ")
                    .append($("<a>").attr("href", "http://www.github.com/" + 
                                          "TikhonJelvis/Silly-Chat")
                            .html("Github"))
                    .append("!");
                addMessage(message, "About", "info");
            },
            description : "Prints information about this chat program."
        }
    };
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
        //window.scrollBy(0, 10000000);
    }
});