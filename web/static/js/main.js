"use strict";

document.addEventListener("DOMContentLoaded", () => {
    let connection = new ChatConnection("wss://" + location.host + location.pathname + "ws");
    connection.setHandler("default", console.log);

    let ui = new Layout();
    document.body.append(ui.DOM);

    connection.openPromise().then(() => {
        let usernamePrompt = new Prompt("enter your username", "username");
        ui.DOM.append(usernamePrompt.DOM);

        usernamePrompt.getPromise().then((username) => {
            connection.send({type:"setUsername",username:username});
        }, () => {});

        ui.messageControls.setSendListener((text) => {
            if(text.length >= 1024*10) {
                ui.statusBar.setError("message is too long");
                return;
            }

            connection.send({type:"sendMessage",content:text});
            ui.messageControls.resetMessageInput();
        });

        connection.setHandler("message", (data) => {
            console.log(data);
            ui.messageList.addMessage(new Message(data.from, data.content, data.timestamp));
        });

        connection.setHandler("userConnected", (data) => {
            ui.userList.addUser(data.username);
            ui.statusBar.setMessage("users: " + ui.userList.usersNum());
        });

        connection.setHandler("userDisconnected", (data) => {
            ui.userList.removeUser(data.username);
            ui.statusBar.setMessage("users: " + ui.userList.usersNum());
        });

        connection.setHandler("userList", (data) => {
            data.usernames.forEach((u) => ui.userList.addUser(u));
            ui.statusBar.setMessage("users: " + ui.userList.usersNum());
        });

        let errorHandlers = {
            "usernameTaken": () => { 
                let usernamePrompt = new Prompt("user with choosen username already exists, please choose another username", 
                    "username", true);
                ui.DOM.append(usernamePrompt.DOM);
                usernamePrompt.getPromise().then((username) => {
                    connection.send({type:"setUsername",username:username});
                }, () => {});
            },
            "usernameInvalid": () => { 
                let usernamePrompt = new Prompt("choosen username is invalid, please choose another username", 
                    "username", true);
                ui.DOM.append(usernamePrompt.DOM);
                usernamePrompt.getPromise().then((username) => {
                    connection.send({type:"setUsername",username:username});
                }, () => {});
            },
            "messageInvalid": () => { 
                ui.statusBar.setError("message invalid");
            },
            "usernameNotSet": () => {
                let usernamePrompt = new Prompt("no username is set, please set a username", 
                    "username", true);
                ui.DOM.append(usernamePrompt.DOM);
                usernamePrompt.getPromise().then((username) => {
                    connection.send({type:"setUsername",username:username});
                }, () => {});
            },
            "default": (data) => { 
                console.log("unknown error", data);
                ui.statusBar.setError("unknown error");
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
});

//not sure what will happen if somebody disconnects while we iterate thru getUserList
