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

var messageInvalid, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"messageInvalid"})

var parseError, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"parseError"})
var unknownTypeError, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"unknownTypeError"})
var unknownError, _ = json.Marshal(map[string]string{"type":ErrorType,"message":"unknownError"})

const (
    UserListType = "userList"
    MessageType = "message"
    HistoryType = "history"
    EmojisType = "emojis"
    UserLeftType = "userLeft"
    UserJoinedType = "userJoined"
    ErrorType = "error"
    SuccessType = "success"
)

type UserList struct {
    Type string `json:"type"`
    Usernames []string `json:"usernames"`
}

type Message struct {
    Type string `json:"type"`
    Content string `json:"content"`
    From string `json:"from"`
    Timestamp int64 `json:"timestamp"`
}

type History struct {
    Type string `json:"type"`
    Content []MessageLogEntry `json:"content"`
}

type UserLeft struct {
    Type string `json:"type"`
    Username string `json:"username"`
}

type UserJoined struct {
    Type string `json:"type"`
    Username string `json:"username"`
}

type Emojis struct {
    Type string `json:"type"`
    Emojis []string `json:"emojis"`
}

//client 

const (
    GetUserListType = "getUserList"
    GetHistoryType = "getHistory"
    GetEmojisType = "getEmojis"
    SendMessageType = "sendMessage"
    SetUsernameType = "setUsername"
)

type GetUserList struct {
    Type string `json:"type"`
}

type GetHistory struct {
    Type string `json:"type"`
}

type GetEmojis struct {
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
