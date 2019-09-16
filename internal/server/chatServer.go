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
    messageLog MessageLog
    logMutex sync.Mutex
    mux *http.ServeMux
    config map[string]interface{}
}

func NewChatServer(config map[string]interface{}) *ChatServer {
    logger.Println("starting the chat server")

    fsServer := http.FileServer(http.Dir("web/static"))
    mux := http.NewServeMux()
    server := &ChatServer{make([]*ChatUser, 0), sync.Mutex{}, NewMessageLog(50), sync.Mutex{}, mux, config}

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

    startServers(server)
    return server
}

func startServers(server *ChatServer) {
    serverConfig := server.config["server"].(map[string]interface{})

    var waitGroup sync.WaitGroup
    waitGroup.Add(1)
    if serverConfig["tls"] != nil {
        waitGroup.Add(1)
    }

    go func() {
        if err := http.ListenAndServe(serverConfig["addr"].(string), server.mux); err != nil { //good code
            logger.Panic("failed to start http server: ", err)
        }
        waitGroup.Done()
    }()

    if serverConfig["tls"] != nil {
        tlsConfig := serverConfig["tls"].(map[string]interface{})
        go func() {
            err := http.ListenAndServeTLS(tlsConfig["addr"].(string), tlsConfig["cert"].(string), tlsConfig["key"].(string), server.mux)
            if err != nil {
                logger.Panic("failed to start https server: ", err)
            }
            waitGroup.Done()
        }()
    }

    waitGroup.Wait()
}

func (server *ChatServer) loop(user *ChatUser) {
    //send a banner
    defer func() {
        server.userDisconnected(user)
        //logger.Println(fmt.Sprintf("loop for user %s stopped", user.username))
    }()

    for {
        message, ok := <-user.connection.readChannel
        if !ok {
            return
        }

        var data map[string]interface{}

        if err := json.Unmarshal([]byte(message), &data); err != nil {
            logger.Println(err)
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
    case GetUserListType:
        msg, err := json.Marshal(UserList{
            UserListType,
            *server.getUsersList(),
        })

        if err == nil {
            user.connection.writeChannel <-msg
        } else {
            logger.Println(err)
            user.connection.writeChannel <-unknownError
        }
    case GetHistoryType:
        server.getHistory(user)
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
        if validateUsername(username) {
            if server.isUsernameTaken(username) {
                user.connection.writeChannel <- usernameTaken
            } else {
                user.username = username
                user.connection.writeChannel <- usernameSet
                server.broadcastMessage(UserConnected{UserConnectedType, user.username})
                logger.Println("new user connected: " + username)
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

    server.usersMutex.Lock()
    defer server.usersMutex.Unlock()

    for _, v := range server.users {
        users = append(users, v.username)
    }

    return &users
}

func (server *ChatServer) sendMessage(user *ChatUser, message string) {
    if !validateMessage(message) {
        user.connection.writeChannel <-messageInvalid
        return
    }

    msg := Message{MessageType, message, user.username, time.Now().Unix()}

    logger.Println(fmt.Sprintf("message from %s: %s", user.username, message))

    server.logMutex.Lock()
    server.messageLog.AddMessage(&msg)
    server.logMutex.Unlock()

    server.broadcastMessage(msg)
}

func (server *ChatServer) getHistory(user *ChatUser) {
    server.logMutex.Lock()
    msg, err := json.Marshal(History{HistoryType, server.messageLog.log})
    server.logMutex.Unlock()

    if err != nil {
        logger.Println(err)
        return
    }

    user.connection.writeChannel <- msg
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
//this however means that more data will be sent and wasted. not a lot but still.
//also, the number of users this server can handle is probably is too small to think about things like this anyway
//update (3 months after writing this): why the fuck do i care
