package main

import (
    "github.com/plaets/shoutbox/internal/server"
    "flag"
    "io/ioutil"
    "encoding/json"
    "fmt"
    //"runtime"
    //"time"
)

func main() {
    //go func() {
    //    timer := time.NewTicker(5 * time.Second)
    //    for {
    //        <-timer.C
    //        fmt.Printf("goroutines left: %d\n", runtime.NumGoroutine())
    //    }
    //}()

    var configFile = flag.String("config", "config.json", "configuration file")
    flag.Parse()

    var configData, err = ioutil.ReadFile(*configFile)
    if err != nil {
        fmt.Println("failed to read configuration file: ", err)
        return
    }

    var config map[string]interface{}
    if err := json.Unmarshal(configData, &config); err != nil {
        fmt.Println("failed to parse configuration file: ", err)
        return
    }

    server.NewChatServer(config)
}
