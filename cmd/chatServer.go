package main

import (
    "net/http"
    "fmt"
    "github.com/gorilla/websocket"
    "encoding/json"
)

type ChatServer struct {
    users []*ChatUser
    mux *http.ServeMux
}

func NewChatServer() *ChatServer {
    mux := http.NewServeMux()
    chatServer := &ChatServer{make([]*ChatUser, 0), mux}

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, "Hello from the shoutbox!")
    })

    mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        conn, err := websocket.Upgrade(w, r, nil, 1024, 1024)
        logError(err)

        user := NewChatUser(NewSocketConnection(conn))
        chatServer.users = append(chatServer.users, user)
        go chatServer.readLoop(user)
    })

    http.ListenAndServe(":9000", mux)

    return chatServer
}

func (server *ChatServer) readLoop(user *ChatUser) {
    defer logger.Println("user read loop broken")
    for {
        message, ok := <-user.connection.readChannel
        logger.Println("got a message")
        if !ok { logger.Println("chnnel closed") }

        var data map[string]interface{}

        if err := json.Unmarshal([]byte(message), &data); err != nil {
            logger.Println("json error")
            user.connection.writeChannel <-parseError
            user.connection.controlChannel <-controlClose
            return
        }

        if data["type"] == nil {
            logger.Println("type error")
            user.connection.writeChannel <-unknownTypeError
            user.connection.controlChannel <-controlClose
            return
        }

        switch data["type"].(string) {
        case "message":
        case "setUsername":
            if data["username"] == nil {
                logger.Println("username is nil")
                user.connection.writeChannel <-usernameInvalid
            } else {
                server.setUsername(user, data["username"].(string))
            }
        }
        logger.Println("user read loop")
    }
}

func (server *ChatServer) setUsername(user* ChatUser, username string) {
    logger.Println("setting username " + username)
    if user.username == "" {
        if len(username) >= 3 && len(username) <= 32 {
            user.username = username
            user.connection.writeChannel <- usernameSet
        } else {
            user.connection.writeChannel <- usernameInvalid
        }
    } else {
        user.connection.writeChannel <- usernameAlreadySet
    }
}
