"use strict";

class UserEntry {
    constructor(username) { this.DOM = document.createElement("div");
        this.DOM.classList.add("userEntry");
        this.username = username;
        this.DOM.innerText = htmlEncode(this.username);
    }
}

class UserList {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.classList.add("userList");
        this.users = [];
    }

    addUser(username) {
        if(username != "" && this.users.find((e) => e.username == username) == undefined) { 
            let user = new UserEntry(username);
            this.users.push(user);
            this.DOM.append(user.DOM);
        }
    }
    
    removeUser(username) {
        let i = this.users.findIndex((u) => u.username == username);
        if(i != -1) {
            this.DOM.removeChild(this.users[i].DOM);
            this.users.splice(i, 1);
        }
    }

    clear() {
        this.users = [];
        while(this.DOM.lastChild) this.DOM.removeChild(this.DOM.lastChild);
    }

    usersNum() {
        return this.users.length;
    }
}
