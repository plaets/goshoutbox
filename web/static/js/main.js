"use strict";

document.addEventListener("DOMContentLoaded", () => {
    let connection = new ChatConnection("ws://" + location.host + location.pathname + "ws");
    connection.setHandler("default", console.log);

    let username = prompt("username");
    connection.send({type:"setUsername",username:username});

    let ui = new Layout();
    document.body.append(ui.DOM);

    ui.messageControls.setSendListener((text) => {
        connection.send({type:"sendMessage",content:text});
    });

    connection.setHandler("message", (data) => {
        console.log(data);
        ui.messageList.addMessage(new Message(data.from, data.content, data.timestamp));
    });

    connection.setHandler("userConnected", (data) => {
        ui.userList.addUser(data.username);
    });

    connection.setHandler("userDisconnected", (data) => {
        ui.userList.removeUser(data.username);
    });

    connection.setHandler("userList", (data) => {
        data.usernames.forEach((u) => ui.userList.addUser(u));
    });

    let errorHandlers = {
        "usernameTaken": () => { 
            let username = prompt("user with choosen username already exists, please choose another username");
            connection.send({type:"setUsername",username:username});
        },
        "usernameInvalid": () => { 
            let username = prompt("choosen username is invalid, please choose another username");
            if(username != undefined) {
                connection.send({type:"setUsername",username:username});
            }
        },
        "messageTooLong": () => { 
            alert("message is too long");
        },
        "default": (data) => { 
            alert("unknown error: " + data.message);
        },
    };

    connection.setHandler("error", (data) => {
        let handler = errorHandlers[data.message];
        if(handler != undefined) {
            handler(data);
        } else {
            errorHandlers["default"](data);
        }
    });

    connection.send({type:"getUserList"});
});

//not sure what will happen if somebody disconnects while we iterate thru getUserList
