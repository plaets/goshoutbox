"use strict";

class Layout {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("shoutbox");
        
        this.messageList = new MessageList();
        this.messageControls = new MessageControls();
        this.userList = new UserList();

        this.DOM.append(this.userList.DOM, this.messageList.DOM, this.messageControls.DOM);
    }
}
