# goshoutbox

Simple websocket shoutbox written in go and pure javascript

You can test a live instance on <https://jsnm.ga/shoutbox/>

## Setup

* Install go <https://golang.org/doc/install>
* Run `go get github.com/plaets/goshoutbox/cmd/goshoutbox/` and navigate to `$GOPATH/src/github.com/plaets/goshoutbox`
* Rename `example-config.json` to `config.json`, modify it (for example, delete the tls section, otherwise the server won't start until you provide the ssl certificates - of course that is not a good idea in practice, but it's ok just for testing the server out)
* Run `go run github.com/plaets/goshoutbox/cmd/goshoutbox/` (or `go build github.com/plaets/goshoutbox/cmd/goshoutbox/` and then run the resulting executable). The `web` directory should be in your working directory, otherwise you won't be able to access the javascript client. 
* Open `http://localhost:9000` in your browser (or `https://localhost:9001` if https is enabled)

## Configuration 

Configuration is stored in the `config.json` file. Example configuration can be seen in `example-config.json`. 

* server (object)
    * addr - (string) address that the http server should listen on
    * tls (object, optional) 
        * addr - (string) address that the https server should listen on
        * key - (string) path to the ssl key 
        * cert - (string) path to the ssl certificate

## Todo

* Banner
* Notifications 
* Flooding prevention
* Basic administration
* Basic markdown
* Private messages 
* More configuration options
* Maybe rewrite the UI in something maintainable 
* Maybe actually *design* the UI
* Authentication plugins/reserving nicknames
* Channels
* More sophisticated logging/history
* Stats
* Filters (delete messages containing words, links, etc. probably better as a plugin)

## Dependencies

* https://github.com/gorilla/websocket
* https://gist.github.com/dperini/729294

## Screenshots

![screenshot 1](screenshot1.png)
![screenshot 2](screenshot2.png)
