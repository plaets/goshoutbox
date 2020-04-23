"use strict";

const now = _ => Math.round(Date.now()/1000);

class Shoutbox {
    constructor() {
        this.ui = new Layout();
        this.connection = new ChatConnection((location.protocol == "https:" ? "wss://" : "ws://") + location.host + location.pathname + "ws"); //probably a bad idea
        this.lastUsername = "";
        this.emojis = {};
        this.reconnecting = false;

        this.connection.openPromise
            .then(() => this.setupHandlers())
            .then(() => this.setupErrorHandlers())
            .then(() => this.setupUI())
            .then(() => this.sendInitMessages());
    }

    setupUI() {
        let usernamePrompt = new Prompt("enter your username", "username");
        this.ui.DOM.append(usernamePrompt.DOM);

        usernamePrompt.getPromise().then((username) => {
            this.lastUsername = username;
            this.connection.send({type:"setUsername",username:username});
        }, () => {});

        this.ui.messageControls.setShowEmojisListener(() => {
            let emojiList = new EmojiList(this.emojis);
            this.ui.DOM.append(emojiList.DOM);
            emojiList.activate();
        });

        this.ui.messageControls.setSendListener((text) => {
            if(text.length >= 1024*10) {
                this.ui.statusBar.setError("message is too long");
                return;
            }

            this.connection.send({type:"sendMessage",content:text});
            this.ui.messageControls.resetMessageInput();
        });

    }

    sendInitMessages() {
        this.connection.send({type:"getUserList"});
        this.connection.send({type:"getEmojis"});
        this.connection.send({type:"getHistory"});
    }

    addMessage(data) {
        let message = new Message(data.from, data.content, data.timestamp);
        message.content.innerHTML = this.parseEmojis(message.content.innerHTML);
        message.content.innerHTML = message.content.innerHTML.replace(/\n/g, "</br>");
        this.ui.messageList.addMessage(message);
    }

    updateUserNumber() {
        this.ui.statusBar.setMessage("users: " + this.ui.userList.usersNum());
    }

    setupHandlers() {
        this.connection.setHandler("message", (data) => {
            this.addMessage(data);
        });

        this.connection.setHandler("userJoined", (data) => {
            this.ui.userList.addUser(data.username);
            this.updateUserNumber();
            this.ui.messageList.addMessage(new UserStatusMessage(data.username, now(), "has joined"));
        });

        this.connection.setHandler("userLeft", (data) => {
            this.ui.userList.removeUser(data.username);
            this.updateUserNumber();
            this.ui.messageList.addMessage(new UserStatusMessage(data.username, now(), "has left"));
        });

        this.connection.setHandler("userList", (data) => {
            data.usernames.forEach((u) => this.ui.userList.addUser(u));
            this.updateUserNumber();
        });

        this.connection.setHandler("history", (data) => {
            data.content.forEach((m) => {
                if(m.type == "msg") {
                    this.addMessage(m);
                } else if(m.type == "joined" || m.type == "left") {
                    this.ui.messageList.addMessage(new UserStatusMessage(m.content, m.timestamp, `has ${m.type}`));
                }
            });
        });

        this.connection.setHandler("emojis", (data) => {
            for(let n of data.emojis) {
                let img =  new Image();
                img.src = `${location.protocol + "//" + location.host + location.pathname}emoji/${n}`;
                img.classList.add("emoji");
                img.alt = `:${n}:`;
                this.emojis[n] = img;
            }
        });
    }

    setupErrorHandlers() {
        let errorHandlers = {
            "usernameTaken": () => { 
                let usernamePrompt = new Prompt("user with choosen username already exists, please choose another username", 
                    "username", true);
                this.ui.DOM.append(usernamePrompt.DOM);
                usernamePrompt.getPromise().then((username) => {
                    this.lastUsername = username;
                    this.connection.send({type:"setUsername",username:username});
                }, () => {});
            },
            "usernameInvalid": () => { 
                let usernamePrompt = new Prompt("choosen username is invalid, please choose another username", 
                    "username", true);
                this.ui.DOM.append(usernamePrompt.DOM);
                usernamePrompt.getPromise().then((username) => {
                    this.lastUsername = username;
                    this.connection.send({type:"setUsername",username:username});
                }, () => {});
            },
            "messageInvalid": () => { 
                this.ui.statusBar.setError("invalid message");
            },
            "usernameNotSet": () => {
                let usernamePrompt = new Prompt("no username is set, please set a username", 
                    "username", true);
                this.ui.DOM.append(usernamePrompt.DOM);
                usernamePrompt.getPromise().then((username) => {
                    this.lastUsername = username;
                    this.connection.send({type:"setUsername",username:username});
                }, () => {});
            },
            "default": (data) => { 
                console.log("unknown error", data);
                this.ui.statusBar.setError("unknown error");
            },
        };

        this.connection.setErrorHandler((err) => {
            console.log(err);
            this.ui.statusBar.setPersistentError("connection error, reconnecting");
            this.reconnect();
        });

        this.connection.closePromise.then((() => {
            this.ui.statusBar.setPersistentError("connection closed, reconnecting");
            this.reconnect();
        }));

        this.connection.setHandler("error", (data) => {
            let handler = errorHandlers[data.message];
            if(handler != undefined) {
                handler(data);
            } else {
                errorHandlers["default"](data);
            }
        });
    }

    parseEmojis(message) {
        let foundEmojis = [...new Set(message.match(/:([a-z_\-]*):/gm))];
        for(let n of foundEmojis) {
            let emoji = this.emojis[n.substr(1, n.length-2)];
            if(emoji != undefined) {
               message = message.replace(new RegExp(n, 'gm'), emoji.outerHTML);
            }
        }

        return message;
    }

    reconnect() {
        if(this.reconnecting) return;
        this.reconnecting = true

        this.reconnectInterval = setInterval(() => {
            this.connection.close(); 
            this.connection = new ChatConnection((location.protocol == "https:" ? "wss://" : "ws://") + location.host + location.pathname + "ws"); 

            this.connection.openPromise
                .then(() => {
                    console.log("reconnected");
                    clearInterval(this.reconnectInterval);

                    this.ui.statusBar.setMessage("connected");
                    this.ui.userList.clear();
                    this.ui.messageList.clear();
                    this.connection.send({type:"setUsername",username:this.lastUsername});
                    this.reconnecting = false;
                })
                .then(() => this.setupHandlers())
                .then(() => this.setupErrorHandlers())
                .then(() => this.sendInitMessages());
        }, 5000);
        //TODO: append new messages after reconnecting instead of removing the old ones
        //TODO: double join message after reconnecting
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    let shoutbox = new Shoutbox();
    document.body.append(shoutbox.ui.DOM);
});

//not sure what will happen if somebody disconnects while we iterate thru getUserList
