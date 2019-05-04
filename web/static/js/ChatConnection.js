"use strict";

class ChatConnection {
    constructor(path) {
        this.websocket = new WebSocket(path);
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
