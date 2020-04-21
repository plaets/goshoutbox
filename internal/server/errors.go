package server

import (
    "net/http"
    "fmt"
    "github.com/gorilla/websocket"
    "log"
    "os"
)

var logger = log.New(os.Stdout, "shoutbox: ", log.Ldate | log.Ltime)

func closeIfError(connection *websocket.Conn, err error) bool {
    if err != nil && websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
        logger.Println(err)
        return true
    }
    return false
}

func logError(err error) bool {
    if err != nil {
        logger.Println(err)
        return true
    }
    return false
}

func closeIfNotOk(conn *SocketConnection, ok bool) bool {
    if !ok {
        conn.controlChannel <-controlClose
    }
    return !ok
}

func sendError(err error, errbody []byte, conn *SocketConnection) bool {
    if err != nil {
        conn.writeChannel <-errbody
        return true
    }
    return false
}

func httpError(w http.ResponseWriter, code int, message string) {
    w.WriteHeader(code)
    fmt.Fprintf(w, "{\"error\": \"%s\"}", message)
}

func sendErrorAndDisconnect(err error, errbody []byte, conn *SocketConnection) bool {
    if err != nil {
        logger.Println("disconnecting")
        logError(err)
        conn.writeChannel <-errbody
        conn.controlChannel <-controlClose
        return true
    }
    return false
}
