"use strict";

class Prompt {
    constructor(label, placeholder="") {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("promptWrapper");

        this.prompt = document.createElement("div");
        this.prompt.classList.add("prompt");

        this.labelWrapper = document.createElement("div");
        this.labelWrapper.classList.add("labelWrapper");

        this.label = document.createElement("span");
        this.label.classList.add("label");
        this.label.innerHTML = label;

        this.labelWrapper.append(this.label);

        this.input = document.createElement("input");
        this.input.classList.add("input");
        this.input.placeholder = placeholder;

        this.confirmButton = document.createElement("button");
        this.confirmButton.classList.add("confirmButton");
        this.confirmButton.innerText = "ok";

        this.cancelButton = document.createElement("button");
        this.cancelButton.classList.add("cancelButton");
        this.cancelButton.innerText = "cancel";

        this.prompt.append(this.labelWrapper, this.input, this.cancelButton, this.confirmButton);
        this.DOM.append(this.prompt);

        this.setupButtons();
    }

    setupButtons() {
        this.promise = new Deferred();

        this.confirmButton.addEventListener("click", () => {
            this.resolve();
        });

        this.cancelButton.addEventListener("click", () => {
            this.DOM.parentElement.removeChild(this.DOM);
            this.promise.reject(this.input.value);
        });

        document.addEventListener("keypress", (e) => {
            if(e.keyCode == 13 && this.input == document.activeElement) {
                this.resolve();
            }
        });
    }

    resolve() {
        this.DOM.parentElement.removeChild(this.DOM);
        this.promise.resolve(this.input.value);
    }

    getPromise() {
        return this.promise;
    }
}
