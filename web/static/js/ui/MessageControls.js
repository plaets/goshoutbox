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

        document.addEventListener("keypress", (e) => {
            if(e.keyCode == 13 && this.input == document.activeElement) {
                this.send();
            }
        });

        this.sendButton.onclick = () => this.send();

        this.DOM.append(this.input, this.sendButton);
    }

    setSendListener(fun) {
        this.sendListener = fun;
    }

    send() {
        this.sendListener(this.input.value);
    }

    resetMessageInput() {
        this.input.value = "";
    }
}
