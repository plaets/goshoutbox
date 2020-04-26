"use strict";

class Layout {
    constructor(config) {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("shoutbox");

        this.topBar = new TopBar();
        this.messageList = new MessageList();
        this.messageControls = new MessageControls();
        this.userList = new UserList();
        this.statusBar = new StatusBar();

        this.DOM.append(this.topBar.DOM, this.userList.DOM, this.messageList.DOM, this.messageControls.DOM, this.statusBar.DOM);
    }
}
