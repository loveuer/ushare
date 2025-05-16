package main

import (
	"context"
	"flag"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/api"
	"github.com/loveuer/ushare/internal/controller"
	"github.com/loveuer/ushare/internal/opt"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"os/signal"
	"syscall"
)

func init() {
	flag.BoolVar(&opt.Cfg.Debug, "debug", false, "debug mode")
	flag.StringVar(&opt.Cfg.Address, "address", "0.0.0.0:9119", "")
	flag.StringVar(&opt.Cfg.DataPath, "data", "/data", "")
	flag.StringVar(&opt.Cfg.Auth, "auth", "", "auth required(admin, password)")
	flag.IntVar(&opt.Cfg.CleanInterval, "clean", 24, "清理文件的周期, 单位: 小时, 0 则表示不自动清理")
	flag.Parse()

	if opt.Cfg.Debug {
		log.SetLogLevel(log.LogLevelDebug)
		tool.TablePrinter(opt.Cfg)
	}
}

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	opt.Init(ctx)
	controller.UserManager.Start(ctx)
	controller.MetaManager.Start(ctx)
	controller.RoomController.Start(ctx)
	api.Start(ctx)

	<-ctx.Done()
}
