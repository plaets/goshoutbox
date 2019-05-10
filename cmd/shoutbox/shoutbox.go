package main

import (
    "github.com/plaets/shoutbox/internal/server"
    "runtime"
    "time"
    "fmt"
)

func main() {
    go func() {
        timer := time.NewTicker(5 * time.Second)
        for {
            <-timer.C
            fmt.Printf("goroutines left: %d\n", runtime.NumGoroutine())
        }
    }()

    server.NewChatServer()
}
