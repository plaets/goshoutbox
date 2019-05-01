package main

import (
    "github.com/gorilla/websocket"
    //"time"
)

const (
    controlClose = 0
)

type SocketConnection struct {
    connection *websocket.Conn
    readChannel chan []byte
    writeChannel chan []byte
    controlChannel chan int
}

func NewSocketConnection(connection *websocket.Conn) *SocketConnection {
    sock := &SocketConnection {
        connection: connection,
        writeChannel: make(chan []byte),
        readChannel: make(chan []byte),
        controlChannel: make(chan int),
    }

    logger.Println("new connection")

    go sock.writeLoop()
    go sock.readLoop()

    return sock
}

func (conn *SocketConnection) readLoop() {
    defer close(conn.readChannel)
    for {
        select {
        case control := <-conn.controlChannel:
            switch control {
            case controlClose:
                return
            default:
                logger.Println("unknown control command")
            }
        default:
            _, message, err := conn.connection.ReadMessage()
            if closeIfError(conn.connection, err) { return }
            conn.readChannel <-message
        }
    }
}

func (conn *SocketConnection) writeLoop() {
    for {
        select {
            case message, ok := <-conn.writeChannel:
                if !ok {
                    conn.controlChannel <-controlClose
                    return
                }

                w, err := conn.connection.NextWriter(websocket.TextMessage)
                if logError(err) { return }
                w.Write(message)
                w.Close()
            case control, _ := <-conn.controlChannel:
                switch control {
                case controlClose:
                    conn.connection.WriteMessage(websocket.CloseMessage,
                        websocket.FormatCloseMessage(websocket.CloseAbnormalClosure, ""))
                    conn.connection.Close()
                    close(conn.writeChannel)
                    close(conn.controlChannel)
                    return
                default:
                    logger.Println("unknown control command")
                }
        }
    }
}
