package server

import (
    "net/http"
    "fmt"
    "github.com/gorilla/websocket"
    "encoding/json"
    "time"
)

type ChatServer struct {
    users []*ChatUser
    mux *http.ServeMux
}

func NewChatServer() *ChatServer {
    logger.Println("starting the chat server")

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
        go chatServer.loop(user)
    })

    http.ListenAndServe(":9000", mux)

    return chatServer
}

func (server *ChatServer) loop(user *ChatUser) {
    //send a banner
    for {
        message, ok := <-user.connection.readChannel
        if !ok { return }

        var data map[string]interface{}

        if err := json.Unmarshal([]byte(message), &data); err != nil {
            user.connection.writeChannel <-parseError
            user.connection.controlChannel <-controlClose
            return
        }

        if data["type"] == nil {
            user.connection.writeChannel <-unknownTypeError
            user.connection.controlChannel <-controlClose
            return
        }

        server.handleMessage(user, data)
    }
}

func (server *ChatServer) handleMessage(user *ChatUser, data map[string]interface{}) {
    switch data["type"].(string) {
    case "message":
        if(user.username != "") {
            message := data["content"].(string)
            server.sendMessage(user, message)
        } else {
            user.connection.writeChannel <- usernameNotSet
        }
    case "getUsersList":
        msg, err := json.Marshal(UsersList{
            UsersListType,
            *server.getUsersList(),
        })

        if err == nil {
            user.connection.writeChannel <-msg
        } else {
            logger.Println(err)
            user.connection.writeChannel <-unknownError
        }
    case "setUsername":
        if data["username"] == nil {
            logger.Println("username is nil")
            user.connection.writeChannel <-usernameInvalid
        } else {
            server.setUsername(user, data["username"].(string))
        }
    }
}

func (server *ChatServer) setUsername(user* ChatUser, username string) {
    logger.Println("setting username " + username)
    if user.username == "" {
        if len(username) >= 3 && len(username) <= 32 {
            if server.isUsernameTaken(username) {
                user.connection.writeChannel <- usernameTaken
            } else {
                user.username = username
                user.connection.writeChannel <- usernameSet
            }
        } else {
            user.connection.writeChannel <- usernameInvalid
        }
    } else {
        user.connection.writeChannel <- usernameAlreadySet
    }
}

func (server *ChatServer) isUsernameTaken(username string) bool {
    for _, v := range server.users {
        if v.username == username {
            return true
        }
    }
    return false
}

func (server *ChatServer) getUsersList() *[]string {
    users := make([]string, 0)
    for _, v := range server.users {
        users = append(users, v.username)
    }

    return &users
}

func (server *ChatServer) sendMessage(user *ChatUser, message string) {
    if len(message) > 10400 {
        user.connection.writeChannel <- messageTooLong
        return
    }

    msg, err := json.Marshal(Message{MessageType, message, user.username, time.Now().Unix()})
    if err == nil {
        for _, v := range server.users {
            v.connection.writeChannel <- msg
        }
    } else {
        user.connection.writeChannel <- unknownError
    }
}

//message will be sent back to the user that sent it. 
//i think (hope) that this will make the message timeline more consistent across users,
//especially if there are many messages sent at once or the latency is big.
//this however means that more data will be sent and wasted. not a lot but still
