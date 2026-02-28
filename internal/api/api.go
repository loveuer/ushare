package api

import (
	"context"
	"net"
	"net/http"

	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/nf/nft/tool"
	"github.com/loveuer/ushare/internal/handler"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/opt"
)

func Start(ctx context.Context) <-chan struct{} {
	app := nf.New(nf.Config{BodyLimit: 10 * 1024 * 1024 * 1024})

	app.Get("/api/healthz", func(c *nf.Ctx) error {
		return c.SendStatus(http.StatusOK)
	})

	// Auth
	app.Post("/api/uauth/login", handler.AuthLogin())
	app.Get("/api/uauth/me", handler.AuthVerify(), handler.AuthMe())

	// File sharing
	app.Get("/ushare/:code", handler.Fetch())
	app.Put("/api/ushare/:filename", handler.AuthVerify(), handler.AuthPermission(model.PermUpload), handler.ShareNew())
	app.Post("/api/ushare/:code", handler.ShareUpload())

	// Local sharing (WebRTC signaling)
	{
		api := app.Group("/api/ulocal")
		api.Post("/register", handler.LocalRegister())
		api.Post("/offer", handler.LocalOffer())
		api.Post("/answer", handler.LocalAnswer())
		api.Post("/candidate", handler.LocalCandidate())
		api.Get("/clients", handler.LocalClients())
		api.Get("/ws", handler.LocalWS())
	}

	// Admin
	{
		api := app.Group("/api/admin")
		api.Get("/users", handler.AuthVerify(), handler.AuthPermission(model.PermUserManage), handler.AdminListUsers())
		api.Post("/users", handler.AuthVerify(), handler.AuthPermission(model.PermUserManage), handler.AdminCreateUser())
		api.Put("/users/:id", handler.AuthVerify(), handler.AuthPermission(model.PermUserManage), handler.AdminUpdateUser())
		api.Delete("/users/:id", handler.AuthVerify(), handler.AuthPermission(model.PermUserManage), handler.AdminDeleteUser())
		api.Get("/roles", handler.AuthVerify(), handler.AuthPermission(model.PermUserManage), handler.AdminListRoles())
	}

	// Token management
	{
		api := app.Group("/api/token")
		api.Get("", handler.AuthVerify(), handler.AuthPermission(model.PermTokenManage), handler.TokenList())
		api.Post("", handler.AuthVerify(), handler.AuthPermission(model.PermTokenManage), handler.TokenCreate())
		api.Delete("", handler.AuthVerify(), handler.AuthPermission(model.PermTokenManage), handler.TokenDelete())
	}

	// API v1 - token-authenticated file upload
	app.Put("/api/v1/upload/:filename", handler.AuthVerify(), handler.AuthPermission(model.PermUpload), handler.ShareAPIUpload())

	// Frontend static files
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
