"use strict";

document.addEventListener("DOMContentLoaded", () => {
    let connection = new ChatConnection("ws://" + location.host + location.pathname + "ws");
    connection.setHandler("default", console.log);

    let username = prompt("username");
    connection.send({type:"setUsername",username:username});

    let ui = new Layout();
    document.body.append(ui.DOM);

    connection.setHandler("message", (data) => {
        console.log(data);
        ui.messageList.addMessage(new Message(data.from, data.content, data.timestamp));
    });
    ui.messageControls.setSendListener((text) => {
        connection.send({type:"sendMessage",content:text});
    });
});
