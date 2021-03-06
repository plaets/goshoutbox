package server

import (
    "github.com/gorilla/websocket"
    "time"
    "fmt"
)

const (
    controlClose = 0
)

const (
    pongTimeout = 16 * time.Second
    writeTimeout = 10 * time.Second
    pingPeriod = 5 * time.Second
    maxMessageSize = 1024 * 10
)

type SocketConnection struct {
    connection *websocket.Conn
    readChannel chan []byte
    writeChannel chan []byte
    controlChannel chan int
    connectionClosed bool
}

func NewSocketConnection(connection *websocket.Conn) *SocketConnection {
    sock := &SocketConnection {
        connection: connection,
        writeChannel: make(chan []byte),
        readChannel: make(chan []byte),
        controlChannel: make(chan int),
        connectionClosed: false,
    }

    logger.Println("new connection")

    go sock.writeLoop()
    go sock.readLoop()

    return sock
}

func (conn *SocketConnection) readLoop() {
    conn.connection.SetReadLimit(maxMessageSize)
    conn.connection.SetReadDeadline(time.Now().Add(pongTimeout))
    conn.connection.SetPongHandler(func(string) error {
        conn.connection.SetReadDeadline(time.Now().Add(pongTimeout))
        return nil
    })

    defer func() {
        close(conn.readChannel)
        recover() //lol
        //logger.Println("read loop stopped")
    }()

    for {
        _, message, err := conn.connection.ReadMessage()
        if err != nil {
            logger.Println(fmt.Sprintf("error when reading a message: %s", err))
            conn.controlChannel <-controlClose
            return
        }
        conn.readChannel <-message
    }
}

//heavily inspired by https://github.com/gorilla/websocket/blob/master/examples/chat/client.go
func (conn *SocketConnection) writeLoop() {
    timer := time.NewTicker(pingPeriod)

    defer func() {
        timer.Stop()
        conn.closeConnection()
        //logger.Println("write loop stopped")
    }()

    for {
        select {
            case message, ok := <-conn.writeChannel:
                conn.connection.SetWriteDeadline(time.Now().Add(writeTimeout))
                if !ok {
                    return
                }

                w, err := conn.connection.NextWriter(websocket.TextMessage)
                if err != nil {
                    logger.Println(fmt.Sprintf("error when getting a writer: %s", err))
                    return
                }
                w.Write(message)
                w.Close()
            case control, _ := <-conn.controlChannel:
                switch control {
                case controlClose:
                    return
                default:
                    logger.Println("unknown control command")
                }
            case <-timer.C:
                conn.connection.SetWriteDeadline(time.Now().Add(writeTimeout))
                if err := conn.connection.WriteMessage(websocket.PingMessage, nil); err != nil {
                    logger.Println(err)
                    return
                }
        }
    }
}

func (conn *SocketConnection) closeConnection() {
    close(conn.writeChannel)
    close(conn.controlChannel)
    conn.connection.WriteMessage(websocket.CloseMessage,
        websocket.FormatCloseMessage(websocket.CloseAbnormalClosure, ""))
    conn.connection.Close()
    //conn.controlChannel <-controlClose
    //will block forever causing a goroutine leak
}
