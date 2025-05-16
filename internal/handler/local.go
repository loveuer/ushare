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
		var (
			ip = c.IP(true)
			ua = c.Get("User-Agent")
		)

		client := controller.RoomController.Register(ip, ua)

		return resp.Resp200(c, client)
	}
}

func LocalClients() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		list := controller.RoomController.List()

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

func LocalOffer() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			Id    string                `json:"id"`
			From  string                `json:"from"`
			Offer *controller.RoomOffer `json:"offer"`
		}

		var (
			err error
			req = new(Req)
		)

		if err = c.BodyParser(req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"err": err.Error()})
		}

		controller.RoomController.Offer(req.Id, req.From, req.Offer)

		return resp.Resp200(c, req.Offer)
	}
}

func LocalAnswer() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			Id     string                `json:"id"`
			Answer *controller.RoomOffer `json:"answer"`
		}

		var (
			err error
			req = new(Req)
		)

		if err = c.BodyParser(req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"err": err.Error()})
		}

		controller.RoomController.Answer(req.Id, req.Answer)

		return resp.Resp200(c, req)
	}
}

func LocalCandidate() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			Id        string                    `json:"id"`
			Candidate *controller.RoomCandidate `json:"candidate"`
		}

		var (
			err error
			req = new(Req)
		)

		if err = c.BodyParser(req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"err": err.Error()})
		}

		controller.RoomController.Candidate(req.Id, req.Candidate)

		return resp.Resp200(c, req)
	}
}
