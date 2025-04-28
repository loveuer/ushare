package handler

import (
	"fmt"
	"github.com/loveuer/nf"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/opt"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
	"net/http"
	"os"
)

func Fetch() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		code := c.Query("code")
		info := new(model.Meta)
		_, err := os.Stat(opt.MetaPath(code))
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				return c.Status(http.StatusNotFound).JSON(map[string]string{"msg": "文件不存在"})
			}

			return c.SendStatus(http.StatusInternalServerError)
		}

		viper.SetConfigFile(opt.MetaPath(code))
		viper.SetConfigType("env")
		if err = viper.ReadInConfig(); err != nil {
			return c.SendStatus(http.StatusInternalServerError)
		}

		if err = viper.Unmarshal(info); err != nil {
			return c.SendStatus(http.StatusInternalServerError)
		}

		c.SetHeader("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, info.Filename))
		http.ServeFile(c.Writer, c.Request, opt.FilePath(code))

		return nil
	}
}
