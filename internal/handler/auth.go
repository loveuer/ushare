package handler

import (
	"fmt"
	"net/http"

	"github.com/loveuer/nf"
	"github.com/loveuer/ushare/internal/controller"
	"github.com/loveuer/ushare/internal/model"
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
		token := tokenFn(c)
		if token == "" {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized"})
		}

		session, err := controller.UserManager.Verify(token)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized", "msg": err.Error()})
		}

		c.Locals("user", session)

		return c.Next()
	}
}

func AuthPermission(perm string) nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		session, ok := c.Locals("user").(*model.Session)
		if !ok || session == nil {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized"})
		}

		for _, p := range session.Permissions {
			if p == perm {
				return c.Next()
			}
		}

		return c.Status(http.StatusForbidden).JSON(map[string]string{"error": "forbidden", "msg": "权限不足"})
	}
}

func AuthMe() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		session, ok := c.Locals("user").(*model.Session)
		if !ok || session == nil {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized"})
		}
		return c.Status(http.StatusOK).JSON(map[string]any{"data": session})
	}
}

func AuthLogin() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		var (
			err     error
			req     Req
			session *model.Session
		)

		if err = c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "错误的用户名或密码<1>"})
		}

		if session, err = controller.UserManager.Login(req.Username, req.Password); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": err.Error()})
		}

		header := fmt.Sprintf("ushare=%s; Path=/; Max-Age=%d", session.Token, 8*3600)
		c.SetHeader("Set-Cookie", header)

		return c.Status(http.StatusOK).JSON(map[string]any{"data": session})
	}
}
