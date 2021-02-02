"use strict";

class UserStatusMessage {
    constructor(username, timestamp, type) {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("message");
        this.DOM.classList.add("statusMessage");

        this.date = new Date(0)
        this.date.setUTCSeconds(timestamp);

        this.timestamp = document.createElement("span");
        this.timestamp.classList.add("timestamp");
        this.timestamp.innerHTML = htmlEncode(`${this.date.getHours()}:${formatZero(this.date.getMinutes().toString(),2)}`);
        this.timestamp.title = htmlEncode(this.date.toISOString());

        this.content = document.createElement("span");
        this.content.classList.add("content");
        this.content.innerHTML = htmlEncode(`user ${username} ${type}`);

        this.DOM.append(this.timestamp, this.content);
    }
}

class Message {
    constructor(username, content, timestamp) {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("message");

        this.date = new Date(0)
        this.date.setUTCSeconds(timestamp);

        this.timestamp = document.createElement("span");
        this.timestamp.classList.add("timestamp");
        this.timestamp.innerHTML = htmlEncode(`${this.date.getHours()}:${formatZero(this.date.getMinutes().toString(),2)}`);
        this.timestamp.title = htmlEncode(this.date.toISOString());

        this.username = document.createElement("span");
        this.username.classList.add("username");
        this.username.innerHTML = htmlEncode(username);

        this.content = document.createElement("span");
        this.content.classList.add("content");
        this.content.innerHTML = htmlEncode(content);

        this.DOM.append(this.timestamp, this.username, this.content);
    }
}

class MessageList {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("messageList");
        this.messages = [];
    }

    //https://stackoverflow.com/a/21067431
    addMessage(message) {
        this.DOM.append(message.DOM);
        this.messages.push(message);

        if(this.DOM.scrollHeight - this.DOM.clientHeight <= (this.DOM.scrollTop + message.DOM.clientHeight + 10)) { 
            this.DOM.scrollTop = this.DOM.scrollHeight;
        }
    } 

    clear() {
        this.messages = [];
        while(this.DOM.lastChild) this.DOM.removeChild(this.DOM.lastChild);
    }
}
