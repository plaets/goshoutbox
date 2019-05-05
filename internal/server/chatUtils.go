package server

import (
    "regexp"
)

func validateUsername(username string) bool {
    regex := regexp.MustCompile("^[A-Za-z0-9_-]+$").MatchString
    return len(username) >= 3 && len(username) <= 32 && regex(username)
}

func validateMessage(message string) bool {
    return len(message) >= 1 && len(message) <= 8192
}
