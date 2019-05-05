"use strict";

class StatusBar {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("statusBarWrapper");

        this.statusBar = document.createElement("span");
        this.statusBar.classList.add("statusBar");

        this.DOM.append(this.statusBar);

        this.message = "";

    }

    setMessage(message) {
        this.message = message;
        this.statusBar.innerHTML = message;
    }

    setError(message) {
        if(this.errorTimeout != undefined) {
            clearTimeout(this.errorTimeout); 
        }

        this.statusBar.innerHTML = message;
        this.statusBar.classList.add("error");

        this.errorTimeout = setTimeout(() => {
            this.statusBar.innerHTML = this.message;
            this.statusBar.classList.remove("error");
        }, 2000);
    }
}
