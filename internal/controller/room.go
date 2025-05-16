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
	RoomMessageTypePing  RoomMessageType = "ping"
	RoomMessageTypeSelf  RoomMessageType = "self"
	RoomMessageTypeEnter RoomMessageType = "enter"
	RoomMessageTypeLeave RoomMessageType = "leave"
)

type roomClient struct {
	sync.Mutex
	controller *roomController
	conn       *websocket.Conn
	ClientType RoomClientType `json:"client_type"`
	AppType    RoomAppType    `json:"app_type"`
	IP         string         `json:"ip"`
	Room       string         `json:"room"`
	Name       string         `json:"name"`
	Id         string         `json:"id"`
	RegisterAt time.Time      `json:"register_at"`
	Offer      any            `json:"offer"`
	Candidate  any            `json:"candidate"`
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
	ctx        context.Context
	rooms      map[string]map[string]*roomClient // map[room_id(remote-IP)][Id]
	notReadies map[string]*roomClient
}

var (
	RoomController = &roomController{
		rooms:      make(map[string]map[string]*roomClient),
		notReadies: make(map[string]*roomClient),
	}
)

func (rc *roomController) Start(ctx context.Context) {
	rc.ctx = ctx
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		for {
			select {
			case <-rc.ctx.Done():
				return
			case now := <-ticker.C:
				for _, nrc := range rc.notReadies {
					if now.Sub(nrc.RegisterAt).Minutes() > 1 {
						rc.Lock()
						delete(rc.notReadies, nrc.Id)
						rc.Unlock()
					}
				}
			}
		}
	}()
}

func (rc *roomController) Register(ip, userAgent string, candidate, offer any) *roomClient {
	nrc := &roomClient{
		controller: rc,
		ClientType: ClientTypeDesktop,
		AppType:    RoomAppTypeWeb,
		IP:         ip,
		Id:         uuid.Must(uuid.NewV7()).String(),
		Name:       tool.RandomName(),
		msgChan:    make(chan any, 1),
		RegisterAt: time.Now(),
		Candidate:  candidate,
		Offer:      offer,
	}

	ua := useragent.Parse(userAgent)
	switch {
	case ua.Mobile:
		nrc.ClientType = ClientTypeMobile
	case ua.Tablet:
		nrc.ClientType = ClientTypeTablet
	}

	key := "local"
	if !tool.IsPrivateIP(ip) {
		key = ip
	}

	nrc.Room = key

	rc.Lock()

	log.Debug("controller.room: registry client, IP = %s(%s), Id = %s, Name = %s", key, nrc.IP, nrc.Id, nrc.Name)
	rc.notReadies[nrc.Id] = nrc
	if _, ok := rc.rooms[nrc.Room]; !ok {
		rc.rooms[nrc.Room] = make(map[string]*roomClient)
	}

	rc.Unlock()

	return nrc
}

func (rc *roomController) Enter(conn *websocket.Conn, id string) {
	client, ok := rc.notReadies[id]
	if !ok {
		log.Warn("controller.room: entry room id not exist, id = %s", id)
		return
	}

	rc.Lock()

	if _, ok = rc.rooms[client.Room]; !ok {
		log.Warn("controller.room: entry room not exist, room = %s, id = %s, name = %s", client.Room, id, client.Name)
		return
	}

	rc.rooms[client.Room][id] = client
	client.conn = conn

	rc.Unlock()

	client.start(rc.ctx)

	rc.Broadcast(client.Room, map[string]any{"type": RoomMessageTypeEnter, "time": time.Now().UnixMilli(), "body": client})
}

func (rc *roomController) List(room string) []*roomClient {
	clientList := make([]*roomClient, 0)

	rc.Lock()
	defer rc.Unlock()

	clients, ok := rc.rooms[room]
	if !ok {
		return clientList
	}

	for _, client := range clients {
		clientList = append(clientList, client)
	}

	return clientList
}

func (rc *roomController) Broadcast(room string, msg any) {
	for _, client := range rc.rooms[room] {
		select {
		case client.msgChan <- msg:
		case <-time.After(2 * time.Second):
			log.Warn("RoomController: broadcast timeout, room = %s, client Id = %s, IP = %s", room, client.Id, client.IP)
		}
	}
}

func (rc *roomController) Unregister(client *roomClient) {
	key := "local"
	if !tool.IsPrivateIP(client.IP) {
		key = client.IP
	}

	log.Debug("controller.room: unregister client, IP = %s(%s), Id = %s, Name = %s", client.IP, key, client.Id, client.Name)

	rc.Lock()
	delete(rc.rooms[key], client.Id)
	rc.Unlock()

	rc.Broadcast(key, map[string]any{"type": RoomMessageTypeLeave, "time": time.Now().UnixMilli(), "body": client})
}
