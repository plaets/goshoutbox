package server

import (
    "encoding/json"
)

//server 

var usernameSet, _ = json.Marshal(map[string]string{"type":SuccessType,"message":"usernameSet"})
var usernameInvalid, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"usernameInvalid"})
var usernameAlreadySet, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"usernameAlreadySet"})
var usernameTaken, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"usernameTaken"})
var usernameNotSet, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"usernameNotSet"})

var messageTooLong, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"messageTooLong"})

var parseError, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"parseError"})
var unknownTypeError, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"unknownTypeError"})
var unknownError, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"unknownError"})

const (
    UsersListType = "usersList"
    MessageType = "message"
    UserDisconnectedType = "userDisconnected"
    UserConnectedType = "userConnected"
    ErrorType = "error"
    SuccessType = "success"
)

type UsersList struct {
    Type string `json:"type"`
    Usernames []string `json:"usernames"`
}

type Message struct {
    Type string `json:"type"`
    Content string `json:"content"`
    From string `json:"from"`
    Timestamp int64 `json:"timestamp"`
}

type UserDisconnected struct {
    Type string `json:"type"`
    Username string `json:"username"`
}

type UserConnected struct {
    Type string `json:"type"`
    Username string `json:"username"`
}

//client - i really hate the fact that i have to move my files to another folder just to have namespaces (packages)

const (
    GetUsersListType = "getUsersList"
    SendMessageType = "sendMessage"
    SetUsernameType = "setUsername"
)

type GetUsersList struct {
    Type string `json:"type"`
}

type SendMessage struct {
    Type string `json:"type"`
    Content string `json:"content"`
}

type SetUsername struct {
    Type string `json:"type"`
    Username string `json:"username"`
}
