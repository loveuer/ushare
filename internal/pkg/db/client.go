package db

import (
	"context"

	"github.com/loveuer/ushare/internal/opt"
	"github.com/loveuer/ushare/internal/pkg/tool"

	"gorm.io/gorm"
)

var Default *Client

type DBType string

const (
	DBTypeSqlite   = "sqlite"
	DBTypeMysql    = "mysql"
	DBTypePostgres = "postgres"
)

type Client struct {
	ctx    context.Context
	cli    *gorm.DB
	dbType DBType
}

func (c *Client) Type() DBType {
	return c.dbType
}

func (c *Client) Session(ctxs ...context.Context) *gorm.DB {
	var ctx context.Context
	if len(ctxs) > 0 && ctxs[0] != nil {
		ctx = ctxs[0]
	} else {
		ctx = tool.Timeout(30)
	}

	session := c.cli.Session(&gorm.Session{Context: ctx})

	if opt.Cfg.Debug {
		session = session.Debug()
	}

	return session
}

func (c *Client) Close() {
	d, _ := c.cli.DB()
	d.Close()
}
