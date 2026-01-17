package opt

import (
	"context"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"os"
)

type config struct {
	Debug         bool
	Address       string
	DataPath      string
	Username      string
	Password      string
	CleanInterval int
}

var (
	Cfg = &config{}
)

func Init(_ context.Context) {
	if Cfg.Username == "" {
		Cfg.Username = "admin"
	}
	if Cfg.Password == "" {
		Cfg.Password = "ushare@123"
	}

	Cfg.Password = tool.NewPassword(Cfg.Password)
	log.Debug("opt.Init: username = %s, encrypted password = %s", Cfg.Username, Cfg.Password)
}

func LoadFromEnv() {
	if username := os.Getenv("USHARE_USERNAME"); username != "" {
		Cfg.Username = username
	}
	if password := os.Getenv("USHARE_PASSWORD"); password != "" {
		Cfg.Password = password
	}
}
