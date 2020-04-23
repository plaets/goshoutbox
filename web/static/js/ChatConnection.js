"use strict";

class ChatConnection {
    constructor(path) {
        this.websocket = new WebSocket(path);
        this.websocket.onmessage = (data) => this.messageListener(data);
        this.websocket.onerror = (err) => this.onError(err);

        this.handlers = {};

        this.openPromise = new Promise((resolve) => {
            this.websocket.addEventListener("open", () => resolve());
        });

        this.closePromise = new Promise((resolve) => {
            this.websocket.addEventListener("close", () => resolve());
        });

        this.errorHandler = () => {};

        this.websocket.onclose = this.closeHandler;
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

    setErrorHandler(fun) {
        this.errorHandler = fun;
    }

    removeHandler(type) {
        this.handlers[type] = undefined;
    }

    onError(err) {
        this.errorHandler(err);
    }

    close() {
        try {
            this.errorHandler = () => {};
            this.websocket.close();
        } catch(e) {
            console.log(e);
        }
    }

    send(data) {
        this.websocket.send(JSON.stringify(data));
    }
}
