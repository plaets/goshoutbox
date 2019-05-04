package server

import (
    "net/http"
    "github.com/gorilla/websocket"
    "encoding/json"
    "time"
    "fmt"
    "sync"
)

type ChatServer struct {
    users []*ChatUser
    usersMutex sync.Mutex
    mux *http.ServeMux
}

func NewChatServer() *ChatServer {
    logger.Println("starting the chat server")

    fsServer := http.FileServer(http.Dir("web/static"))
    mux := http.NewServeMux()
    server := &ChatServer{make([]*ChatUser, 0), sync.Mutex{}, mux}

    mux.Handle("/", fsServer)
    mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        conn, err := websocket.Upgrade(w, r, nil, 1024, 1024)
        if logError(err) { return }

        user := NewChatUser(NewSocketConnection(conn))

        server.usersMutex.Lock()
        server.users = append(server.users, user)
        server.usersMutex.Unlock()

        go server.loop(user)
    })

    http.ListenAndServe(":9000", mux)

    return server
}

func (server *ChatServer) loop(user *ChatUser) {
    //send a banner
    defer func() {
        server.userDisconnected(user)
        logger.Println(fmt.Sprintf("loop for user %s stopped", user.username))
    }()

    for {
        message, ok := <-user.connection.readChannel
        if !ok {
            return
        }

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
    case SendMessageType:
        if(user.username != "") {
            message := data["content"].(string)
            server.sendMessage(user, message)
        } else {
            user.connection.writeChannel <- usernameNotSet
        }
    case GetUsersListType:
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
    case SetUsernameType:
        if data["username"] == nil {
            user.connection.writeChannel <-usernameInvalid
        } else {
            server.setUsername(user, data["username"].(string))
        }
    default:
        user.connection.writeChannel <-unknownTypeError
    }
}

func (server *ChatServer) setUsername(user* ChatUser, username string) {
    if user.username == "" {
        if len(username) >= 3 && len(username) <= 32 {
            if server.isUsernameTaken(username) {
                user.connection.writeChannel <- usernameTaken
            } else {
                user.username = username
                user.connection.writeChannel <- usernameSet
                server.broadcastMessage(UserConnected{UserConnectedType, user.username})
                logger.Println("setting username " + username)
            }
        } else {
            user.connection.writeChannel <- usernameInvalid
        }
    } else {
        user.connection.writeChannel <- usernameAlreadySet
    }
}

func (server *ChatServer) isUsernameTaken(username string) bool {
    server.usersMutex.Lock()
    defer server.usersMutex.Unlock()
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

    server.broadcastMessage(Message{MessageType, message, user.username, time.Now().Unix()})
}

func (server *ChatServer) broadcastMessage(val interface{}) {
    msg, err := json.Marshal(val)
    if err == nil {
        server.broadcastBytes(msg)
    } else {
        logger.Println(err)
    }
}

func (server *ChatServer) broadcastBytes(msg []byte) {
    server.usersMutex.Lock()
    for _, v := range server.users {
        v.connection.writeChannel <-msg
    }
    server.usersMutex.Unlock()
}

func (server *ChatServer) userDisconnected(user *ChatUser) {
    username := user.username
    server.usersMutex.Lock()
    for i, v := range server.users {
        if v == user {
            server.users[i] = nil
            server.users = append(server.users[:i], server.users[i+1:]...)
        }
    }
    server.usersMutex.Unlock()
    if user.username != "" {
        logger.Println(fmt.Sprintf("user %s disconnected", user.username))
        logger.Println(fmt.Sprintf("users left: %d", len(server.users)))
        server.broadcastMessage(UserDisconnected{UserDisconnectedType, username})
    }
}

//message will be sent back to the user that sent it. 
//i think (hope) that this will make the message timeline more consistent across users,
//especially if there are many messages sent at once or the latency is big.
//this however means that more data will be sent and wasted. not a lot but still