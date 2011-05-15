function ChatInterface(url, options) {
    var shownWelcome = false,// Have we shown the welcome message yet?
        effectsOn = false;// Effects will be turned on after the welcome message.

    // Connection:
    var connection = new ChatConnection(url, options),
        commands = {},// All the valid commands.
        errorMessages = false;// Show connection-related errors?
    
    // Elements:
    var element = $("<div>").addClass("chat"),
        controls = $("<div>").addClass("controls"),
        holder = $("<div>").addClass("holder"),
        input = $("<input>").attr("type", "text").addClass("main"),
        statusBar = $("<div>").addClass("statusBar"),
        messages = $("<div>").addClass("messages");

    // Element buffer, holds all of the message divs (even the ones that are not
    // displayed at the moment:
    var elementBuffer = [],
        maxElements = 50;// Maximum number of elements to display.
    
    // Sent messages and commands:
    var sentCommands = [],
        currentCommand = 0,// The command currently displayed. Reset each send().
        commandsShifted = false;// Whether previous commands have been looked at.

    $("body").keydown(function (event) {
        switch (event.keyCode) {
        case 13 :
            send();
            break;
        case 38 :
            previousCommand();
            break;
        case 40 :
            nextCommand();
            break;
        default :
            // Do nothing!
            break;
        }

        return;
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
            var message = "Request failed. <br /> Status: " + event.status
                + " <br /> Message: " + event.message + " <br /> request: "
                + event.request;
            if (errorMessages) {
                errorMessage(message);
            }
        } else {
            var messages = event.messages;

            // If there is more than the max number of elements, only load
            // the maximum number.
            if (messages.length > maxElements) {
                var offset = messages.length - maxElements;
                messages.splice(0, offset);
            }

            for (var i = 0; i < messages.length; i++) {
                var date = new Date(messages[i].time),
                    timestamp = date.toLocaleTimeString() + "::" +
                    date.toDateString();

                timestamp = '<span class="time"> ' + timestamp + '</span>';
                addMessage(messages[i].message, messages[i].username +
                           timestamp);
            }

            welcome();
        }
    });
    setTimeout(welcome, 200);

    /* Returns the chat interface's main element. */
    this.getElement = function () {
        return element;
    };

    /* Focuses on the chat interface's main input. */
    this.focus = function () {
        input.focus();
    };

    /* Shows the welcome message. */
    function welcome() {
        if (!shownWelcome) {
            // A simple welcome message:
            addMessage("Enter &#92;help for a list of available commands",
                       "Welcome " + options.username, "info");
            shownWelcome = true;
            effectsOn = true;
        }
    }

    /* Moves one back in the command history, as on pressing the up arrow. */
    function previousCommand() {
        if (sentCommands.length > 0) {
            if (currentCommand === -1) {
                currentCommand = 1;
                sentCommands.unshift(input.val());
            } else if (currentCommand >= sentCommands.length) {
                currentCommand = 0;
            }
            
            input.val(sentCommands[currentCommand]);
            currentCommand++;

            commandsShifted = true;
        }
    }

    /* Moves one forward in the command history, as on pressing the down arrow.*/
    function nextCommand() {
        if (currentCommand > 1) {
            currentCommand--;
            input.val(sentCommands[currentCommand - 1]);
        }
    }

    /* Sends the message currently entered, clearing the input. */
    function send() {
        var message = input.val();

        if (commandsShifted) {
            sentCommands.shift();
            commandsShifted = false;
        }
        
        sentCommands.unshift(message);
        currentCommand = -1;

        if (isCommand(message)) {
            execute(message);
        } else if (message) {
            connection.sendMessage(message);
        }
        
        input.val("");
    }

    /* Determines if the given message is a command. Commands start with "/" */
    function isCommand(message) {
        return /^[\\\/][^[(].*$/.test(message);
    }

    /* Executes the given command. If the command is not defined, nothing
     * happens.
     */
    function execute(command) {
        var message = command;
        command = command.replace(/^[\\\/]/, "");
        command = command.replace(/\s+/, " ");
        var args = command.split(" ");
        command = args.splice(0, 1)[0];
        
        if (!(command in commands)) {
            errorMessage("Command <span class=\"code\">" + command +
                         "</span> does not exist");
            return;
        }

        if (commands[command].command) {
            try {
                commands[command].command.apply(this, args);
            } catch (e) {
                errorMessage("Command not valid!<br />" + e);
            }
        } else {
            connection.sendMessage(message);
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

        elementBuffer.push(messageDiv);

        if (elementBuffer.length > maxElements) {
            var element = elementBuffer.shift();
            element.remove();
        }

        messageDiv.hide();
        messages.append(messageDiv);
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, messageDiv[0]]);

        effectsOn ? messageDiv.fadeIn("slow") : messageDiv.show();
        setTimeout(function () { window.scrollBy(0, 10000);}, 100);
        
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
            command : function (command) {
                var message = $("<div>"),
                    instructions = 'Commands are called using a slash ("/") or' +
                    ' backslash ("\\"). LaTeX commands can only follow a ' +
                    'backslash. An example would be: <span class="code">\\id' +
                    '</span>. Type this to get your client id. Type ' +
                    '<span class="code">\\help &lt;command&gt;</span> where ' +
                    '<span class="code">&lt;command&gt;</span> is the command ' +
                    'name to find out more about each command.',
                commandList = $("<ul>");

                if (command) {
                    command = command.replace(/^[\/\\]/, "");
                    if (!commands[command]) {
                        addMessage('Command <span class="code">' + command +
                                   ' </span> does not exist.', 'Help', 'info');
                        return;
                    } else {
                        message.append($("<h1>").html(command).addClass("code"));
                        message.append($("<p>")
                                       .html(commands[command].description));
                    }
                } else {
                    message.append($("<p>").html(instructions));
                    message.append($("<h1>").html("All Commands:")
                                   .addClass("code"));

                    for (var commandName in commands) {
                        if (commands.hasOwnProperty(commandName) &&
                            commands[commandName].description) {
                            var item = $("<li>");
                            item.append($("<h1>").html(commandName)
                                        .addClass("code"));
                            commandList.append(item);
                        }
                    }

                    message.append(commandList);
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
        },
        errorsOn : {
            command : function () {
                errorMessages = true;
                addMessage('Connection error messages <span class="code">' +
                           'on.</span>', "Error Reporting", "info");
            },
            description : "Turns extra error messages on. If they're already on"
                + " nothing happens."
        },
        errorsOff : {
            command : function () {
                errorMessages = false;
                addMessage('Connection error messages <span class="code">' +
                           'off.</span>', "Error Reporting", "info");
            },
            description : "Turns extra error messages off. If they're already " +
                "off, nothing happens."
        },
        effectsOn : {
            command : function () {
                effectsOn = true;
                addMessage('Pretty JavaScript effects <span class="code">' +
                           'on.</span>', "JavaScript Effects", "info");
            },
            description : "Turns on effects like a fade-in for new messages."
        },
        effectsOff : {
            command : function () {
                effectsOn = false;
                addMessage('Pretty JavaScript effects <span class="code">' +
                           'off.</span>', "JavaScript Effects", "info");
            },
            description : "Turns off all fancy JavaScript effects. This may be" +
                " good for slower computers."
        },
        "[" : {
            description : "Starts \\(\\LaTeX\\) math display mode. Can be " +
                "anywhere in the text. Should be closed with \\]. Can be used" +
                " multiple times in one message as long as it is closed each " +
                "time. This has to be used with a backslash (\"\\\")!"
        },
        "(" : {
            description :  "Starts \\(\\LaTeX\\) math inline mode. Can be " +
                "anywhere in the text. Should be closed with \\). Can be used" +
                " multiple times in one message as long as it is closed each " +
                "time. This has to be used with a backslash (\"\\\")!"
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

    prompt.focus();

    function startChat() {
        var username = prompt.val();
        $("body").empty();
        chat = new ChatInterface("chat", {username : username});
        $("body").append(chat.getElement());
        window.scrollBy(0, 10000000);
        chat.focus();
    }
});

