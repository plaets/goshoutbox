"use strict";

function formatZero(string, length) {
    return "0".repeat(length - string.length) + string;
}

class Message {
    constructor(username, content, timestamp) {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("message");

        this.date = new Date(0)
        this.date.setUTCSeconds(timestamp);

        this.timestamp = document.createElement("span");
        this.timestamp.classList.add("timestamp");
        this.timestamp.innerHTML = `${this.date.getHours()}:${formatZero(this.date.getMinutes().toString(),2)}`;

        this.username = document.createElement("span");
        this.username.classList.add("username");
        this.username.innerHTML = username;

        this.content = document.createElement("span");
        this.content.classList.add("content");
        this.content.innerHTML = content;

        this.DOM.append(this.timestamp, this.username, this.content);
    }
}

class MessageList {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("messageList");
        this.messages = [];
    }

    addMessage(message) {
        this.DOM.append(message.DOM);
        this.messages.push(message);
    }
}
