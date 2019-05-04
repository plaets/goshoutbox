"use strict";

class UserEntry {
    constructor(username) {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("userEntry");
        this.username = username;
        this.DOM.innerText = this.username;
    }
}

class UserList {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("userList");
        this.users = [];
    }

    addUser(username) {
        let user = new UserEntry(username);
        this.users.append(user);
        this.DOM.append(user);
    }
    
    removeUser(username) {
        let i = this.users.findIndex((u) => u.username == username);
        this.DOM.removeChild(this.users[i].DOM);
        this.users.splice(i, 1);
    }
}
