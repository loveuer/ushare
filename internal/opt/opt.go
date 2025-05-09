package opt

import (
	"context"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/pkg/tool"
)

type config struct {
	Debug    bool
	Address  string
	DataPath string
	Auth     string
}

var (
	Cfg = &config{}
)

func Init(_ context.Context) {
	if Cfg.Auth != "" {
		Cfg.Auth = tool.NewPassword(Cfg.Auth)
		log.Debug("opt.Init: encrypted password = %s", Cfg.Auth)
	}
}
