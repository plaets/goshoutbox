"use strict";

class TopBar {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("topBar");

        this.banner = document.createElement("div");
        this.banner.classList.add("banner");

        this.DOM.append(this.banner);
    }

    setBanner(banner) {
        this.banner.innerHTML = htmlEncode(banner);
    }
}
