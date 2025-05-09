package main

import (
	"context"
	"flag"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/api"
	"github.com/loveuer/ushare/internal/controller"
	"github.com/loveuer/ushare/internal/opt"
	"os/signal"
	"syscall"
)

func init() {
	flag.BoolVar(&opt.Cfg.Debug, "debug", false, "debug mode")
	flag.StringVar(&opt.Cfg.Address, "address", "0.0.0.0:9119", "")
	flag.StringVar(&opt.Cfg.DataPath, "data", "/data", "")
	flag.StringVar(&opt.Cfg.Auth, "auth", "", "auth required(admin, password)")
	flag.Parse()

	if opt.Cfg.Debug {
		log.SetLogLevel(log.LogLevelDebug)
		log.Debug("start server with debug mode")
	}
}

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	opt.Init(ctx)
	controller.UserManager.Start(ctx)
	controller.MetaManager.Start(ctx)
	api.Start(ctx)

	<-ctx.Done()
}
