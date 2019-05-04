"use strict";

class MessageControls {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("messageControls");

        this.input = document.createElement("input");
        this.input.classList.add("messageInput");
        this.input.placeholder = "message";

        this.sendButton = document.createElement("button");
        this.sendButton.classList.add("sendButton");
        this.sendButton.innerText = "send";

        this.DOM.append(this.input, this.sendButton);
    }

    setSendListener(fun) {
        this.sendButton.onclick = () => fun(this.input.value);
    }

    resetMessageInput() {
        this.input.value = "";
    }
}

class ChatConnection {
    constructor(path) {
        this.websocket = new WebSocket(path);
        this.websocket.binaryType = "text";
        this.websocket.onmessage = (data) => this.messageListener(data);

        this.handlers = {};
    }

    messageListener(data) {
        this.handleMessage(JSON.parse(data.data));
    }

    handleMessage(message) {
        if(message.type != undefined && this.handlers[message.type] != undefined) {
            this.handlers[message.type](message);
        } else if(this.handlers["default"] != undefined) {
            this.handlers["default"](message);
        } 
    }

    setHandler(type, fun) {
        this.handlers[type] = fun;
    }

    removeHandler(type) {
        this.handlers[type] = undefined;
    }

    send(data) {
        console.log("sending", data);
        this.websocket.send(JSON.stringify(data));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let connection = new ChatConnection("ws://" + location.host + location.pathname + "ws");
    connection.setHandler("default", console.log);

    let username = prompt("username");
    connection.send({type:"setUsername",username:username});

    connection.setHandler("message", (data) => {
        console.log(data);
        let message = document.createElement("div");
        message.innerText = data.from + ": " + data.content;
        document.body.append(message);
    });

    let ctrls = new MessageControls();
    document.body.append(ctrls.DOM);
    ctrls.setSendListener((text) => {
        connection.send({type:"sendMessage",content:text});
        ctrls.resetMessageInput();
    });
});
