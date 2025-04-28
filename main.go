package main

import (
	"context"
	"flag"
	"github.com/loveuer/ushare/internal/api"
	"github.com/loveuer/ushare/internal/opt"
	"os/signal"
	"syscall"
)

func init() {
	flag.BoolVar(&opt.Cfg.Debug, "debug", false, "debug mode")
	flag.StringVar(&opt.Cfg.Address, "address", "0.0.0.0:80", "")
	flag.StringVar(&opt.Cfg.DataPath, "data", "/data", "")
	flag.Parse()
}

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	api.Start(ctx)

	<-ctx.Done()
}
