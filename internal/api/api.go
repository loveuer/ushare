package api

import (
	"context"
	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/nf/nft/tool"
	"github.com/loveuer/ushare/internal/handler"
	"github.com/loveuer/ushare/internal/opt"
	"net"
	"net/http"
)

func Start(ctx context.Context) <-chan struct{} {
	app := nf.New(nf.Config{BodyLimit: 10 * 1024 * 1024 * 1024})

	app.Get("/api/available", func(c *nf.Ctx) error {
		return c.SendStatus(http.StatusOK)
	})

	app.Get("/api/share/fetch", handler.Fetch())

	ready := make(chan struct{})
	ln, err := net.Listen("tcp", opt.Cfg.Address)
	if err != nil {
		log.Fatal(err.Error())
	}

	go func() {
		ready <- struct{}{}
		if err = app.RunListener(ln); err != nil {
			log.Fatal(err.Error())
		}
	}()

	<-ready

	go func() {
		ready <- struct{}{}
		<-ctx.Done()
		if err = app.Shutdown(tool.Timeout(3)); err != nil {
			log.Warn(err.Error())
		}

		ready <- struct{}{}
	}()

	<-ready

	return ready
}
