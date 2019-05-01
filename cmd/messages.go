package main

import (
    "encoding/json"
)

var usernameSet, _ = json.Marshal(map[string]string{"type":"success","message":"usernameSet"})
var usernameInvalid, _ = json.Marshal(map[string]string{"type":"error","message":"usernameInvalid"})
var usernameAlreadySet, _ = json.Marshal(map[string]string{"type":"error","message":"usernameAlreadySet"})
var usernamTaken, _ = json.Marshal(map[string]string{"type":"error","message":"usernameTaken"})

var parseError, _ = json.Marshal(map[string]string{"type":"error","message":"parseError"})
var unknownTypeError, _ = json.Marshal(map[string]string{"type":"error","message":"unknownTypeError"})
var unknownError, _ = json.Marshal(map[string]string{"type":"error","message":"unknownError"})
