package handler

import (
	"github.com/gorilla/websocket"
	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/controller"
	"net/http"
)

func LocalRegistry() nf.HandlerFunc {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	return func(c *nf.Ctx) error {

		ip := c.IP(true)
		ua := c.Get("User-Agent")

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Error("LocalRegistry: failed to upgrade websocket connection, err = %s", err.Error())
			return err
		}

		controller.RoomController.Register(conn, ip, ua)

		return nil
	}
}
