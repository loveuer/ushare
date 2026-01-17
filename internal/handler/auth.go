package handler

import (
	"fmt"
	"github.com/loveuer/nf"
	"github.com/loveuer/ushare/internal/controller"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/opt"
	"net/http"
)

func AuthVerify() nf.HandlerFunc {
	tokenFn := func(c *nf.Ctx) (token string) {
		if token = c.Get("Authorization"); token != "" {
			return
		}

		token = c.Cookies("ushare")

		return
	}

	return func(c *nf.Ctx) error {
		if opt.Cfg.Username == "" || opt.Cfg.Password == "" {
			return c.Next()
		}

		token := tokenFn(c)
		if token == "" {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized"})
		}

		op, err := controller.UserManager.Verify(token)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized", "msg": err.Error()})
		}

		c.Locals("user", op)

		return c.Next()
	}
}

func AuthLogin() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		var (
			err error
			req Req
			op  *model.User
		)

		if err = c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "错误的用户名或密码<1>"})
		}

		if op, err = controller.UserManager.Login(req.Username, req.Password); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": err.Error()})
		}

		header := fmt.Sprintf("ushare=%s; Path=/; Max-Age=%d", op.Token, 8*3600)
		c.SetHeader("Set-Cookie", header)

		return c.Status(http.StatusOK).JSON(map[string]any{"data": op})
	}
}
