package handler

import (
	"github.com/gorilla/websocket"
	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/nf/nft/resp"
	"github.com/loveuer/ushare/internal/controller"
	"net/http"
)

func LocalRegister() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			Candidate any `json:"candidate"`
			Offer     any `json:"offer"`
		}

		var (
			err error
			req = new(Req)
			ip  = c.IP(true)
			ua  = c.Get("User-Agent")
		)

		if err = c.BodyParser(req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]interface{}{"msg": err.Error()})
		}

		client := controller.RoomController.Register(ip, ua, req.Candidate, req.Offer)

		return resp.Resp200(c, client)
	}
}

func LocalClients() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		room := c.Query("room")
		if room == "" {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"err": "room can't be empty"})
		}

		list := controller.RoomController.List(room)

		return resp.Resp200(c, list)
	}
}

func LocalWS() nf.HandlerFunc {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	return func(c *nf.Ctx) error {

		id := c.Query("id")

		if id == "" {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"error": "id is empty"})
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Error("LocalWS: failed to upgrade websocket connection, err = %s", err.Error())
			return err
		}

		controller.RoomController.Enter(conn, id)

		return nil
	}
}
