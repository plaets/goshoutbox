"use strict";

class Alert {
    constructor(label, activate=false) {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("promptWrapper");
        this.DOM.classList.add("alertWrapper");

        this.alert = document.createElement("div");
        this.alert.classList.add("prompt");
        this.alert.classList.add("alert");

        this.labelWrapper = document.createElement("div");
        this.labelWrapper.classList.add("labelWrapper");

        this.label = document.createElement("span");
        this.label.classList.add("label");
        this.label.innerHTML = label;

        this.labelWrapper.append(this.label);

        this.confirmButton = document.createElement("button");
        this.confirmButton.classList.add("confirmButton");
        this.confirmButton.innerText = "ok";

        this.alert.append(this.labelWrapper, this.confirmButton);
        this.DOM.append(this.alert);

        this.setupButtons();

        if(activate) {
            this.alert.focus();
        }
    }

    setupButtons() {
        this.promise = new Deferred();

        this.confirmButton.addEventListener("click", () => {
            this.resolve();
        });

        document.addEventListener("keypress", (e) => {
            if(e.keyCode == 13 && this.input == document.activeElement) {
                this.resolve();
            }
        });
    }

    resolve() {
        this.DOM.parentElement.removeChild(this.DOM);
        this.promise.resolve();
    }

    getPromise() {
        return this.promise;
    }
    
    activate() {
        this.alert.focus();
    }
}
