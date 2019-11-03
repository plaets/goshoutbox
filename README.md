# goshoutbox

Simple websocket shoutbox written in go and pure javascript

## Setup

* Install go https://golang.org/doc/install
* Run `go build github.com/plaets/shoutbox/cmd/shoutbox/`
* Copy the `example-config.json` to your current directory, rename it to `config.json`
* Run `go run github.com/plaets/shoutbox/cmd/shoutbox/` or copy the executable from `$GOPATH/src/github.com/plaets/goshoutbox/cmd/goshoutbox/goshoutbox`

## Todo

* Configuration
* Custom emoticons
* Basic markdown
* Private messages 
* Basic administration
* Flooding prevention

### Future

* Authentication plugins / reserving nicknames
* Channels
* More sophisticated logging/history
* Stats
* Filters (word, links, etc)
* Admin notifications

## Configuration 

Configuration is stored in the `config.json` file. Example configuration can be seen in `example-config.json`.

```
{
    "server": { 
        "addr": ":9000", //address that the server should bind to, here ':9000' means 'listen on port 9000'
        "tls": { //optional ssl config
            "addr": ":9001", //address of the ssl socket
            "key": "server.key", //path to the ssl key 
            "cert": "server.crt" //path to the ssl certificate
        }
    }
}
```

## Screenshots

![screenshot 1](screenshot1.png)
![screenshot 2](screenshot2.png)
