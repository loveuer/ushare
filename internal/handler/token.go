package handler

import (
	"net/http"

	"github.com/loveuer/nf"
	"github.com/loveuer/ushare/internal/controller"
	"github.com/loveuer/ushare/internal/model"
)

func TokenList() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		session, ok := c.Locals("user").(*model.Session)
		if !ok || session == nil {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized"})
		}

		tokens, err := controller.TokenManager.List(session.UserID)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": err.Error()})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{"data": tokens})
	}
}

func TokenCreate() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		session, ok := c.Locals("user").(*model.Session)
		if !ok || session == nil {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized"})
		}

		type Req struct {
			Name string `json:"name"`
		}

		var req Req
		if err := c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "请求格式错误"})
		}

		t, rawToken, err := controller.TokenManager.Create(session.UserID, req.Name)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": err.Error()})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{
			"data": map[string]any{
				"id":         t.ID,
				"name":       t.Name,
				"token":      rawToken,
				"created_at": t.CreatedAt,
			},
		})
	}
}

func TokenDelete() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		session, ok := c.Locals("user").(*model.Session)
		if !ok || session == nil {
			return c.Status(http.StatusUnauthorized).JSON(map[string]string{"error": "unauthorized"})
		}

		type Req struct {
			ID uint `json:"id"`
		}

		var req Req
		if err := c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "请求格式错误"})
		}

		if req.ID == 0 {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "token id 不能为空"})
		}

		if err := controller.TokenManager.Delete(session.UserID, req.ID); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": err.Error()})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{"data": "ok"})
	}
}
