package server

type MessageLogEntry struct {
    From string `json:"from"`
    Content string `json:"content"`
    Timestamp int64 `json:"timestamp"`
}

type MessageLog struct {
    log []MessageLogEntry
    limit int
}

func NewMessageLog(limit int) MessageLog {
    return MessageLog{log: make([]MessageLogEntry, 0), limit: limit}
}

func (log *MessageLog) AddMessage(message *Message) {
    if len(log.log) >= log.limit {
        log.RemoveLastMessage()
    }

    log.log = append(log.log, MessageLogEntry{message.From, message.Content, message.Timestamp})
}

func (log *MessageLog) RemoveLastMessage() {
    log.log = log.log[1:]
}
