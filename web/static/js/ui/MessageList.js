"use strict";

class Message {
    constructor(username, content, timestamp) {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("message");

        this.date = new Date(0)
        this.date.setUTCSeconds(timestamp);

        this.timestamp = document.createElement("span");
        this.timestamp.classList.add("timestamp");
        this.timestamp.innerHTML = htmlEncode(`${this.date.getHours()}:${formatZero(this.date.getMinutes().toString(),2)}`);

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

    clearMessages() {
        while(this.DOM.lastChild) this.DOM.removeChild(this.DOM.lastChild);
    }
}
