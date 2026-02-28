package main

import (
	"context"
	"flag"
	"os"
	"path/filepath"

	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/api"
	"github.com/loveuer/ushare/internal/controller"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/opt"
	"github.com/loveuer/ushare/internal/pkg/db"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"os/signal"
	"syscall"
)

func init() {
	flag.BoolVar(&opt.Cfg.Debug, "debug", false, "debug mode")
	flag.StringVar(&opt.Cfg.Address, "address", "0.0.0.0:9119", "")
	flag.StringVar(&opt.Cfg.DataPath, "data", "/data", "")
	flag.IntVar(&opt.Cfg.CleanInterval, "clean", 24, "清理文件的周期, 单位: 小时, 0 则表示不自动清理")
	flag.Parse()

	opt.LoadFromEnv()

	if opt.Cfg.Debug {
		log.SetLogLevel(log.LogLevelDebug)
		tool.TablePrinter(opt.Cfg)
	}
}

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	opt.Init(ctx)

	if err := os.MkdirAll(opt.Cfg.DataPath, 0755); err != nil {
		log.Fatal("main: create data path failed: %s", err.Error())
	}

	dbPath := filepath.Join(opt.Cfg.DataPath, ".ushare.db")
	if err := db.Init(ctx, "sqlite::"+dbPath); err != nil {
		log.Fatal("main: init db failed: %s", err.Error())
	}
	log.Debug("main: db initialized at %s", dbPath)

	if err := db.Default.Migrate(&model.Role{}, &model.User{}); err != nil {
		log.Fatal("main: db migrate failed: %s", err.Error())
	}

	controller.UserManager.Start(ctx)
	controller.MetaManager.Start(ctx)
	controller.RoomController.Start(ctx)
	api.Start(ctx)

	<-ctx.Done()
}
