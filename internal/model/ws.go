package model

type WSMessageType string

const (
	WSMessageTypeOffer     WSMessageType = "offer"
	WSMessageTypeCandidate WSMessageType = "candidate"
)

type Message struct {
	Type WSMessageType `json:"type"`
	Time int64         `json:"time"`
	Body any           `json:"body"`
}
