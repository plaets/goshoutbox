# goshoutbox

Simple websocket shoutbox written in go and pure javascript

## Setup

* Install go https://golang.org/doc/install
* Copy `example-config.json` to your working directory, rename it to `config.json`, modify it (for example, delete the tls section, otherwise the server won't start until you provide the ssl certificates - of course that is not a good idea in practice, but it's ok just for testing the server out)
* Run `go run github.com/plaets/goshoutbox/cmd/goshoutbox/` or `go build github.com/plaets/goshoutbox/cmd/goshoutbox/` and copy the executable from `$GOPATH/src/github.com/plaets/goshoutbox/cmd/goshoutbox/goshoutbox`

## Configuration 

Configuration is stored in the `config.json` file. Example configuration can be seen in `example-config.json`. 

* server (object)
    * addr - (string) address that the http server should listen on
    * tls (object, optional) 
        * addr - (string) address that the https server should listen on
        * key - (string) path to the ssl key 
        * cert - (string) path to the ssl certificate

## Todo

* Configuration
* Custom emoticons
* Basic markdown
* Private messages 
* Basic administration
* Flooding prevention
* Maybe rewrite the UI in something maintainable 

### Future

* Authentication plugins / reserving nicknames
* Channels
* More sophisticated logging/history
* Stats
* Filters (word, links, etc)
* Admin notifications

## Screenshots

![screenshot 1](screenshot1.png)
![screenshot 2](screenshot2.png)
