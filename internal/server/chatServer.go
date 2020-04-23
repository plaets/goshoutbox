package server

import (
    "net/http"
    "github.com/gorilla/websocket"
    "encoding/json"
    "time"
    "strings"
    "fmt"
    "io"
    "os"
    "strconv"
    "sync"
)

type ChatServer struct {
    users []*ChatUser
    usersMutex sync.Mutex
    messageLog MessageLog
    logMutex sync.Mutex
    mux *http.ServeMux
    emojis []string
    config map[string]interface{}
}

func NewChatServer(config map[string]interface{}) *ChatServer {
    logger.Println("starting the chat server")

    emojis := make([]string, 0)
    for _, v := range config["emoji"].([]interface{}) {
        emojis = append(emojis, v.(map[string]interface{})["name"].(string))
    }

    fsServer := http.FileServer(http.Dir("web/static"))
    mux := http.NewServeMux()
    server := &ChatServer{make([]*ChatUser, 0), sync.Mutex{}, NewMessageLog(50), sync.Mutex{}, mux, emojis, config}

    mux.Handle("/", fsServer)
    mux.HandleFunc("/emoji/", getEmoji(server))
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
    case GetEmojisType:
        server.getEmojis(user)
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

                server.logMutex.Lock()
                server.messageLog.AddJoinMessage(user.username)
                server.logMutex.Unlock()

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

func (server *ChatServer) getEmojis(user *ChatUser) {
    server.logMutex.Lock()
    msg, err := json.Marshal(Emojis{EmojisType, server.emojis})
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

    if username != "" {
        server.logMutex.Lock()
        server.messageLog.AddExitMessage(username)
        server.logMutex.Unlock()
    }

    if user.username != "" {
        logger.Println(fmt.Sprintf("user %s disconnected", user.username))
        logger.Println(fmt.Sprintf("users left: %d", len(server.users)))
        server.broadcastMessage(UserDisconnected{UserDisconnectedType, username})
    }
}

func getEmoji(server *ChatServer) func(http.ResponseWriter, *http.Request) {
    return func(w http.ResponseWriter, r *http.Request) {
        emojiName := strings.TrimPrefix(r.URL.Path, "/emoji/")
        for _, v := range server.config["emoji"].([]interface{}) {
            if v.(map[string]interface{})["name"].(string) == emojiName {
                sendImage(v.(map[string]interface{})["path"].(string), w)
                return
            }
        }

        httpError(w, 404, "emoji not found")
        return
    }
}

func sendImage(path string, w http.ResponseWriter) {
    file, err := os.Open(path)
    defer file.Close()
    if err != nil {
        logger.Printf("error: couldn't access image %s", path)
        httpError(w, 404, "couldn't access the file")
        return
    }

    header := make([]byte, 512)
    file.Read(header)
    contentType := http.DetectContentType(header)

    stat, _ := file.Stat()
    size := strconv.FormatInt(stat.Size(), 10)

    //w.Header().Set("Content-Disposition", "attachment; filename="+stat.Name())
    w.Header().Set("Content-Type", contentType)
    w.Header().Set("Content-Length", size)

    file.Seek(0, 0)
    io.Copy(w, file)
    return
}
