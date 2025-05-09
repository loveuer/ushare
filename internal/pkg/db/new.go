package db

import (
	"context"
	"fmt"
	"strings"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const tip = `example:
for sqlite   -> sqlite::<filepath>
				sqlite::data.sqlite
				sqlite::/data/data.db
for mysql    -> mysql::<gorm_dsn>
				mysql::user:pass@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local
for postgres -> postgres::<gorm_dsn>
				postgres::host=localhost user=gorm password=gorm dbname=gorm port=9920 sslmode=disable TimeZone=Asia/Shanghai
`

func New(ctx context.Context, uri string) (*Client, error) {
	parts := strings.SplitN(uri, "::", 2)

	if len(parts) != 2 {
		return nil, fmt.Errorf("db.Init: db uri invalid\n%s", tip)
	}

	c := &Client{}

	var (
		err error
		dsn = parts[1]
	)

	switch parts[0] {
	case "sqlite":
		c.dbType = DBTypeSqlite
		c.cli, err = gorm.Open(sqlite.Open(dsn))
	case "mysql":
		c.dbType = DBTypeMysql
		c.cli, err = gorm.Open(mysql.Open(dsn))
	case "postgres":
		c.dbType = DBTypePostgres
		c.cli, err = gorm.Open(postgres.Open(dsn))
	default:
		return nil, fmt.Errorf("db type only support: [sqlite, mysql, postgres], unsupported db type: %s", parts[0])
	}

	if err != nil {
		return nil, fmt.Errorf("db.Init: open %s with dsn:%s, err: %w", parts[0], dsn, err)
	}

	return c, nil
}

func Init(ctx context.Context, uri string) (err error) {
	if Default, err = New(ctx, uri); err != nil {
		return err
	}

	return nil
}
