"use strict";

document.addEventListener("DOMContentLoaded", () => {
    let connection = new ChatConnection((location.protocol == "https:" ? "wss://" : "ws://") + location.host + location.pathname + "ws"); //probably a bad idea
    connection.setHandler("default", console.log);

    let ui = new Layout();
    document.body.append(ui.DOM);

    let emojis = {};

    function parseEmojis(message) {
        let foundEmojis = [...new Set(message.match(/:([a-z_\-]*):/gm))];
        for(let n of foundEmojis) {
            let emoji = emojis[n.substr(1, n.length-2)];
            if(emoji != undefined) {
               message = message.replace(new RegExp(n, 'gm'), emoji.outerHTML);
            }
        }

        return message;
    }

    connection.openPromise().then(() => {
        let usernamePrompt = new Prompt("enter your username", "username");
        ui.DOM.append(usernamePrompt.DOM);

        usernamePrompt.getPromise().then((username) => {
            connection.send({type:"setUsername",username:username});
        }, () => {});

        ui.messageControls.setShowEmojisListener(() => {
            let emojiList = new EmojiList(emojis);
            ui.DOM.append(emojiList.DOM);
            emojiList.activate();
        });

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
            let message = new Message(data.from, data.content, data.timestamp);
            message.content.innerHTML = parseEmojis(message.content.innerHTML);
            ui.messageList.addMessage(message);
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

        connection.setHandler("history", (data) => {
            data.content.forEach((m) => {
                let message = new Message(m.from, m.content, m.timestamp);
                message.content.innerHTML = parseEmojis(message.content.innerHTML);
                ui.messageList.addMessage(message);
            });
        });

        connection.setHandler("emojis", (data) => {
            for(let n of data.emojis) {
                let img =  new Image();
                img.src = `${location.protocol + "//" + location.host + location.pathname}emoji/${n}`;
                img.classList.add("emoji");
                emojis[n] = img;
            }
            console.log(emojis);
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
        connection.send({type:"getEmojis"});
        connection.send({type:"getHistory"});
    });
});

//not sure what will happen if somebody disconnects while we iterate thru getUserList
