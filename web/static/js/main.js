"use strict";

class Shoutbox {
    constructor() {
        this.ui = new Layout();
        this.connection = new ChatConnection((location.protocol == "https:" ? "wss://" : "ws://") + location.host + location.pathname + "ws"); //probably a bad idea
        this.lastUsername = "";
        this.emojis = {};

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

    setupHandlers() {
        this.connection.setHandler("message", (data) => {
            let message = new Message(data.from, data.content, data.timestamp);
            message.content.innerHTML = this.parseEmojis(message.content.innerHTML);
            this.ui.messageList.addMessage(message);
        });

        this.connection.setHandler("userConnected", (data) => {
            this.ui.userList.addUser(data.username);
            this.ui.statusBar.setMessage("users: " + this.ui.userList.usersNum());
        });

        this.connection.setHandler("userDisconnected", (data) => {
            this.ui.userList.removeUser(data.username);
            this.ui.statusBar.setMessage("users: " + this.ui.userList.usersNum());
        });

        this.connection.setHandler("userList", (data) => {
            data.usernames.forEach((u) => this.ui.userList.addUser(u));
            this.ui.statusBar.setMessage("users: " + this.ui.userList.usersNum());
        });

        this.connection.setHandler("history", (data) => {
            data.content.forEach((m) => {
                let message = new Message(m.from, m.content, m.timestamp);
                message.content.innerHTML = this.parseEmojis(message.content.innerHTML);
                this.ui.messageList.addMessage(message);
            });
        });

        this.connection.setHandler("emojis", (data) => {
            for(let n of data.emojis) {
                let img =  new Image();
                img.src = `${location.protocol + "//" + location.host + location.pathname}emoji/${n}`;
                img.classList.add("emoji");
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
                    this.connection.send({type:"setUsername",username:username});
                }, () => {});
            },
            "usernameInvalid": () => { 
                let usernamePrompt = new Prompt("choosen username is invalid, please choose another username", 
                    "username", true);
                this.ui.DOM.append(usernamePrompt.DOM);
                usernamePrompt.getPromise().then((username) => {
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
        this.reconnectInterval = setInterval(() => {
            this.connection.close(); //close the old connection, not 100% sure if thats needed, it looks like the browser is supposed to close the old connection when a new connection to the same address is initiated
            this.connection = new ChatConnection((location.protocol == "https:" ? "wss://" : "ws://") + location.host + location.pathname + "ws"); 

            this.connection.openPromise
                .then(() => {
                    console.log("reconnected");
                    clearInterval(this.reconnectInterval);
                    this.ui.statusBar.setMessage("connected");
                    this.ui.userList.clear();
                    this.connection.send({type:"setUsername",username:this.lastUsername});
                })
                .then(() => this.setupHandlers())
                .then(() => this.setupErrorHandlers())
                .then(() => this.sendInitMessages());
        }, 1000);
        //TODO: there is a possibility, that after reconnecting all messages will be doubled 
        //(client loses connection, reconnects, asks for history, gets the same old history with maybe few new messages, 
        //appends all the messages from the new history to the old message list)
        //i dont want to just purge the old history since the new history may be empty if the connection was lost due to the server crashing 
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    let shoutbox = new Shoutbox();
    document.body.append(shoutbox.ui.DOM);
});

//not sure what will happen if somebody disconnects while we iterate thru getUserList
