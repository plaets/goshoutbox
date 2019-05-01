package main

import (
    //"encoding/json"
    //"errors"
)

type ChatUser struct {
    connection *SocketConnection
    username string
}

func NewChatUser(conn *SocketConnection) *ChatUser {
    user := &ChatUser {
        connection: conn,
        username: "",
    }

    return user
}
