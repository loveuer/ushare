// room controller:
// local share websocket room controller
// same remote IP as a
package controller

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"github.com/mileusna/useragent"
	"sync"
	"time"
)

type RoomClientType string

const (
	ClientTypeDesktop RoomClientType = "desktop"
	ClientTypeMobile  RoomClientType = "mobile"
	ClientTypeTablet  RoomClientType = "tablet"
)

type RoomAppType string

const (
	RoomAppTypeWeb = "web"
)

type RoomMessageType string

const (
	RoomMessageTypeEnter RoomMessageType = "enter"
	RoomMessageTypeLeave RoomMessageType = "leave"
)

type RoomOffer struct {
	SDP  string `json:"sdp"`
	Type string `json:"type"`
}

type RoomCandidate struct {
	Candidate        string `json:"candidate"`
	SdpMid           string `json:"sdpMid"`
	SdpMLineIndex    int    `json:"sdpMLineIndex"`
	UsernameFragment string `json:"usernameFragment"`
}

type roomClient struct {
	sync.Mutex
	controller *roomController
	conn       *websocket.Conn
	ClientType RoomClientType `json:"client_type"`
	AppType    RoomAppType    `json:"app_type"`
	IP         string         `json:"ip"`
	Name       string         `json:"name"`
	Id         string         `json:"id"`
	RegisterAt time.Time      `json:"register_at"`
	msgChan    chan any
}

func (rc *roomClient) start(ctx context.Context) {
	// start write
	go func() {
		for {
			select {
			case <-ctx.Done():
				_ = rc.conn.Close()
				return
			case msg, _ := <-rc.msgChan:
				err := rc.conn.WriteJSON(msg)
				log.Debug("RoomClient: write json message, IP = %s, Id = %s, Name = %s, err = %v", rc.IP, rc.Id, rc.Name, err)
				if err != nil {
					log.Error("RoomClient: write json message failed, IP = %s, Id = %s, Name = %s, err = %s", rc.IP, rc.Id, rc.Name, err.Error())
				}
			}
		}
	}()

	// start read
	go func() {
		for {
			mt, bs, err := rc.conn.ReadMessage()
			if err != nil {
				log.Error("RoomClient: read message failed, IP = %s, Id = %s, Name = %s, err = %s", rc.IP, rc.Id, rc.Name, err.Error())
				rc.controller.Unregister(rc)
				return
			}

			switch mt {
			case websocket.PingMessage:
				rs, _ := json.Marshal(map[string]any{"type": "pong", "time": time.Now().UnixMilli(), "Id": rc.Id, "Name": rc.Name})
				if err := rc.conn.WriteMessage(websocket.PongMessage, rs); err != nil {
					log.Error("RoomClient: response ping message failed, IP = %s, Id = %s, Name = %s, err = %s", rc.IP, rc.Id, rc.Name, err.Error())
				}
			case websocket.CloseMessage:
				log.Debug("RoomClient: received close message, unregister IP = %s Id = %s, Name = %s", rc.IP, rc.Id, rc.Name)
				rc.controller.Unregister(rc)
				return
			case websocket.TextMessage:
				log.Debug("RoomClient: received text message, IP = %s, Id = %s, Name = %s, text = %s", rc.IP, rc.Id, rc.Name, string(bs))
			case websocket.BinaryMessage:
				log.Debug("RoomClient: received bytes message, IP = %s, Id = %s, Name = %s, text = %s", rc.IP, rc.Id, rc.Name, string(bs))
				// todo
				//msg := new(model.Message)
				//if err = json.Unmarshal(bs, msg); err != nil {
				//	log.Error("RoomClient: unmarshal message failed, id = %s, name = %s, err = %s", rc.Id, rc.Name, err.Error())
				//	continue
				//}
				//
				//switch msg.Type {
				//case model.WSMessageTypeOffer:
				//	rc.Lock()
				//	rc.Offer = msg.Body
				//	rc.Unlock()
				//case model.WSMessageTypeCandidate:
				//	rc.Lock()
				//	rc.Candidate = msg.Body
				//	rc.Unlock()
				//}
			}
		}
	}()
}

type roomController struct {
	sync.Mutex
	ctx context.Context
	//rooms      map[string]map[string]*roomClient // map[room_id(remote-IP)][Id]
	pre     map[string]*roomClient
	clients map[string]*roomClient
}

var (
	RoomController = &roomController{
		pre:     make(map[string]*roomClient),
		clients: make(map[string]*roomClient),
	}
)

func (rc *roomController) Start(ctx context.Context) {
	rc.ctx = ctx
}

func (rc *roomController) Register(ip, userAgent string) *roomClient {
	nrc := &roomClient{
		controller: rc,
		ClientType: ClientTypeDesktop,
		AppType:    RoomAppTypeWeb,
		IP:         ip,
		Id:         uuid.Must(uuid.NewV7()).String(),
		Name:       tool.RandomName(),
		msgChan:    make(chan any, 1),
		RegisterAt: time.Now(),
	}

	ua := useragent.Parse(userAgent)
	switch {
	case ua.Mobile:
		nrc.ClientType = ClientTypeMobile
	case ua.Tablet:
		nrc.ClientType = ClientTypeTablet
	}

	rc.Lock()
	defer rc.Unlock()

	rc.pre[nrc.Id] = nrc

	return nrc
}

func (rc *roomController) Enter(conn *websocket.Conn, id string) *roomClient {
	log.Debug("controller.room: registry client, id = %s", id)

	rc.Lock()
	defer rc.Unlock()

	nrc, ok := rc.pre[id]
	if !ok {
		return nil
	}

	nrc.conn = conn
	nrc.start(rc.ctx)

	rc.Broadcast(map[string]any{"type": "enter", "time": time.Now().UnixMilli(), "body": nrc})

	delete(rc.pre, nrc.Id)
	rc.clients[nrc.Id] = nrc

	return nrc
}

func (rc *roomController) List() []*roomClient {
	clientList := make([]*roomClient, 0)

	for _, client := range rc.clients {
		clientList = append(clientList, client)
	}

	return clientList
}

func (rc *roomController) Broadcast(msg any) {
	for _, client := range rc.clients {
		select {
		case client.msgChan <- msg:
		case <-time.After(2 * time.Second):
			log.Warn("RoomController: broadcast timeout, client Id = %s, IP = %s", client.Id, client.IP)
		}
	}
}

func (rc *roomController) Unregister(client *roomClient) {
	log.Debug("controller.room: unregister client, IP = %s, Id = %s, Name = %s", client.IP, client.Id, client.Name)

	rc.Lock()
	delete(rc.clients, client.Id)
	rc.Unlock()

	rc.Broadcast(map[string]any{"type": RoomMessageTypeLeave, "time": time.Now().UnixMilli(), "body": client})
}

func (rc *roomController) Offer(id, from string, offer *RoomOffer) {
	if _, ok := rc.clients[id]; !ok {
		return
	}

	rc.clients[id].msgChan <- map[string]any{
		"type": "offer",
		"time": time.Now().UnixMilli(),
		"data": map[string]any{
			"id":    id,
			"from":  from,
			"offer": offer,
		},
	}
}

func (rc *roomController) Answer(id string, answer *RoomOffer) {
	if _, ok := rc.clients[id]; !ok {
		return
	}

	rc.clients[id].msgChan <- map[string]any{
		"type": "answer",
		"time": time.Now().UnixMilli(),
		"data": map[string]any{
			"id":     id,
			"answer": answer,
		},
	}
}

func (rc *roomController) Candidate(id string, candidate *RoomCandidate) {
	if _, ok := rc.clients[id]; !ok {
		return
	}

	for _, client := range rc.clients {
		if client.Id == id {
			continue
		}

		client.msgChan <- map[string]any{
			"type": "candidate",
			"time": time.Now().UnixMilli(),
			"data": map[string]any{
				"id":        client.Id,
				"candidate": candidate,
			},
		}
	}
}
