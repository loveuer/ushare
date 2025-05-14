// room controller:
// local share websocket room controller
// same remote ip as a
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

type roomClient struct {
	controller *roomController
	conn       *websocket.Conn
	clientType RoomClientType
	appType    RoomAppType
	ip         string
	name       string
	id         string
	msgChan    chan any
}

func (rc *roomClient) start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case msg, _ := <-rc.msgChan:
				err := rc.conn.WriteJSON(msg)
				log.Debug("RoomClient: write json message, ip = %s, id = %s, name = %s, err = %v", rc.ip, rc.id, rc.name, err)
				if err != nil {
					log.Error("RoomClient: write json message failed, ip = %s, id = %s, name = %s, err = %s", rc.ip, rc.id, rc.name, err.Error())
				}
			default:
				mt, bs, err := rc.conn.ReadMessage()
				if err != nil {
					log.Error("RoomClient: read message failed, ip = %s, id = %s, name = %s, err = %s", rc.ip, rc.id, rc.name, err.Error())
					rc.controller.Unregister(rc)
					return
				}

				switch mt {
				case websocket.PingMessage:
					rs, _ := json.Marshal(map[string]any{"type": "pong", "time": time.Now().UnixMilli(), "id": rc.id, "name": rc.name})
					if err := rc.conn.WriteMessage(websocket.PongMessage, rs); err != nil {
						log.Error("RoomClient: response ping message failed, ip = %s, id = %s, name = %s, err = %s", rc.ip, rc.id, rc.name, err.Error())
					}
				case websocket.CloseMessage:
					log.Debug("RoomClient: received close message, unregister ip = %s id = %s, name = %s", rc.ip, rc.id, rc.name)
					rc.controller.Unregister(rc)
					return
				case websocket.TextMessage:
					log.Info("RoomClient: received text message, ip = %s, id = %s, name = %s, text = %s", rc.ip, rc.id, rc.name, string(bs))
				case websocket.BinaryMessage:
					// todo
					log.Info("RoomClient: received bytes message, ip = %s, id = %s, name = %s, text = %s", rc.ip, rc.id, rc.name, string(bs))
				}
			}
		}
	}()
}

type roomController struct {
	sync.Mutex
	ctx   context.Context
	rooms map[string]map[string]*roomClient // map[room_id(remote-ip)][id]
}

var (
	RoomController = &roomController{
		rooms: make(map[string]map[string]*roomClient),
	}
)

func (rc *roomController) Start(ctx context.Context) {
	rc.ctx = ctx

	go func() {
		ticker := time.NewTicker(10 * time.Second)
		for {
			select {
			case <-ctx.Done():
				return
			case now := <-ticker.C:
				for room := range rc.rooms {
					rc.Broadcast(room, now.String())
				}
			}
		}
	}()
}

func (rc *roomController) Register(c *websocket.Conn, ip, userAgent string) {
	nrc := &roomClient{
		controller: rc,
		conn:       c,
		clientType: ClientTypeDesktop,
		appType:    RoomAppTypeWeb,
		ip:         ip,
		id:         uuid.Must(uuid.NewV7()).String(),
		name:       tool.RandomName(),
		msgChan:    make(chan any, 1),
	}

	ua := useragent.Parse(userAgent)
	switch {
	case ua.Mobile:
		nrc.clientType = ClientTypeMobile
	case ua.Tablet:
		nrc.clientType = ClientTypeTablet
	}

	key := "local"
	if !tool.IsPrivateIP(ip) {
		key = ip
	}

	rc.Lock()

	if _, ok := rc.rooms[key]; !ok {
		rc.rooms[key] = make(map[string]*roomClient)
	}

	nrc.start(rc.ctx)
	log.Debug("controller.room: registry client, ip = %s(%s), id = %s, name = %s", key, nrc.ip, nrc.id, nrc.name)
	rc.rooms[key][nrc.id] = nrc

	rc.Unlock()

	rc.Broadcast(key, "new member")
}

func (rc *roomController) Broadcast(room string, msg any) {
	for _, client := range rc.rooms[room] {
		client.msgChan <- msg
	}
}

func (rc *roomController) Unregister(client *roomClient) {
	key := "local"
	if !tool.IsPrivateIP(client.ip) {
		key = client.ip
	}

	rc.Lock()
	defer rc.Unlock()

	log.Debug("controller.room: unregister client, ip = %s(%s), id = %s, name = %s", client.ip, key, client.id, client.name)

	delete(rc.rooms[key], client.id)
}
