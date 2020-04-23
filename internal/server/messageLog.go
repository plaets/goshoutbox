package server

import (
    "time"
)

const (
    MessageLogEntryUserMessage = "msg"
    MessageLogEntryJoinedMessage = "joined"
    MessageLogEntryLeftMessage = "left"
    MessageLogEntryFromServer = "server"
)

type MessageLogEntry struct {
    From string `json:"from"`
    Type string `json:"type"`
    Content string `json:"content"` //contains username if message type is exit or join
    Timestamp int64 `json:"timestamp"`
}

type MessageLog struct {
    log []MessageLogEntry
    limit int
}

func NewMessageLog(limit int) MessageLog {
    return MessageLog{log: make([]MessageLogEntry, 0), limit: limit}
}

func (log *MessageLog) checkLogLimit() {
    if len(log.log) >= log.limit {
        log.RemoveLastMessage()
    }
}

func (log *MessageLog) AddMessage(message *Message) {
    log.checkLogLimit()
    log.log = append(log.log, MessageLogEntry{message.From,
        MessageLogEntryUserMessage, message.Content, message.Timestamp})
}

func (log *MessageLog) AddExitMessage(username string) {
    log.checkLogLimit()
    log.log = append(log.log, MessageLogEntry{MessageLogEntryFromServer,
        MessageLogEntryLeftMessage, username, time.Now().Unix()})
}

func (log *MessageLog) AddJoinMessage(username string) {
    log.checkLogLimit()
    log.log = append(log.log, MessageLogEntry{MessageLogEntryFromServer,
        MessageLogEntryJoinedMessage, username, time.Now().Unix()})
}

func (log *MessageLog) RemoveLastMessage() {
    log.log = log.log[1:]
}
