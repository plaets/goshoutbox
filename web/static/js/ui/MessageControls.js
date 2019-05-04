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
        this.sendButton.onclick = () => {
            fun(this.input.value);
            this.resetMessageInput();
        }
    }

    resetMessageInput() {
        this.input.value = "";
    }
}
