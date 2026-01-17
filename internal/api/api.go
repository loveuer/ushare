package api

import (
	"context"
	"net"
	"net/http"

	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/nf/nft/tool"
	"github.com/loveuer/ushare/internal/handler"
	"github.com/loveuer/ushare/internal/opt"
)

func Start(ctx context.Context) <-chan struct{} {
	app := nf.New(nf.Config{BodyLimit: 10 * 1024 * 1024 * 1024})

	app.Get("/api/healthz", func(c *nf.Ctx) error {
		return c.SendStatus(http.StatusOK)
	})

	app.Get("/ushare/:code", handler.Fetch())
	app.Put("/api/ushare/:filename", handler.AuthVerify(), handler.ShareNew()) // 获取上传 code, 分片大小
	app.Post("/api/ushare/:code", handler.ShareUpload())                       // 分片上传接口
	app.Post("/api/uauth/login", handler.AuthLogin())

	{
		api := app.Group("/api/ulocal")
		api.Post("/register", handler.LocalRegister())
		api.Post("/offer", handler.LocalOffer())
		api.Post("/answer", handler.LocalAnswer())
		api.Post("/candidate", handler.LocalCandidate())
		api.Get("/clients", handler.LocalClients())
		api.Get("/ws", handler.LocalWS())
	}

	// 静态文件服务 - 作为中间件处理
	app.Use(handler.ServeFrontendMiddleware())

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
