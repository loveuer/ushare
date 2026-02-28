package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/pkg/db"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"github.com/spf13/cast"
)

// userResp is the JSON response shape for a user including role info,
// built manually at the business layer instead of relying on GORM associations.
type userResp struct {
	ID        uint       `json:"id"`
	Username  string     `json:"username"`
	RoleID    uint       `json:"role_id"`
	Role      model.Role `json:"role"`
	Active    bool       `json:"active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func toUserResp(u model.User, r model.Role) userResp {
	return userResp{
		ID:        u.ID,
		Username:  u.Username,
		RoleID:    u.RoleID,
		Role:      r,
		Active:    u.Active,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func AdminListUsers() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		var users []model.User
		if err := db.Default.Session().Find(&users).Error; err != nil {
			log.Error("handler.AdminListUsers: %s", err.Error())
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "查询失败"})
		}

		// Collect unique role IDs and query them in one shot
		roleIDSet := make(map[uint]struct{})
		for _, u := range users {
			roleIDSet[u.RoleID] = struct{}{}
		}
		roleIDs := make([]uint, 0, len(roleIDSet))
		for id := range roleIDSet {
			roleIDs = append(roleIDs, id)
		}

		var roles []model.Role
		if err := db.Default.Session().Where("id IN ?", roleIDs).Find(&roles).Error; err != nil {
			log.Error("handler.AdminListUsers: query roles: %s", err.Error())
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "查询失败"})
		}

		roleMap := make(map[uint]model.Role, len(roles))
		for _, r := range roles {
			roleMap[r.ID] = r
		}

		resp := make([]userResp, 0, len(users))
		for _, u := range users {
			resp = append(resp, toUserResp(u, roleMap[u.RoleID]))
		}

		return c.Status(http.StatusOK).JSON(map[string]any{"data": resp})
	}
}

func AdminCreateUser() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			Username string `json:"username"`
			Password string `json:"password"`
			RoleID   uint   `json:"role_id"`
		}

		var req Req
		if err := c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "参数错误"})
		}

		req.Username = strings.TrimSpace(req.Username)
		if req.Username == "" {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "用户名不能为空"})
		}
		if req.Password == "" {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "密码不能为空"})
		}
		if req.RoleID == 0 {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "角色不能为空"})
		}

		if err := tool.CheckPassword(req.Password); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": err.Error()})
		}

		var count int64
		db.Default.Session().Model(&model.User{}).Where("username = ?", req.Username).Count(&count)
		if count > 0 {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "用户名已存在"})
		}

		var role model.Role
		if err := db.Default.Session().First(&role, req.RoleID).Error; err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "无效的角色"})
		}

		user := &model.User{
			Username: req.Username,
			Password: tool.NewPassword(req.Password),
			RoleID:   req.RoleID,
			Active:   true,
		}

		if err := db.Default.Session().Create(user).Error; err != nil {
			log.Error("handler.AdminCreateUser: %s", err.Error())
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "创建用户失败"})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{"data": toUserResp(*user, role)})
	}
}

func AdminUpdateUser() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		type Req struct {
			RoleID   *uint  `json:"role_id"`
			Active   *bool  `json:"active"`
			Password string `json:"password"`
		}

		id, err := cast.ToUintE(c.Param("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "无效的用户ID"})
		}

		var req Req
		if err := c.BodyParser(&req); err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "参数错误"})
		}

		session := c.Locals("user").(*model.Session)

		var user model.User
		if err := db.Default.Session().First(&user, id).Error; err != nil {
			return c.Status(http.StatusNotFound).JSON(map[string]string{"msg": "用户不存在"})
		}

		var currentRole model.Role
		if err := db.Default.Session().First(&currentRole, user.RoleID).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "查询角色失败"})
		}

		updates := map[string]any{}

		if req.RoleID != nil && *req.RoleID != user.RoleID {
			var newRole model.Role
			if err := db.Default.Session().First(&newRole, *req.RoleID).Error; err != nil {
				return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "无效的角色"})
			}
			// If demoting from admin, ensure at least one other active admin remains
			if currentRole.Name == model.RoleAdmin && newRole.Name != model.RoleAdmin {
				var adminCount int64
				db.Default.Session().Model(&model.User{}).
					Where("role_id = ? AND active = ? AND id != ?", user.RoleID, true, id).
					Count(&adminCount)
				if adminCount == 0 {
					return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "无法更改角色: 系统中至少需要一个管理员"})
				}
			}
			updates["role_id"] = *req.RoleID
			currentRole = newRole
		}

		if req.Active != nil && *req.Active != user.Active {
			if user.ID == session.UserID && !*req.Active {
				return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "不能禁用自己的账号"})
			}
			if currentRole.Name == model.RoleAdmin && !*req.Active {
				var adminCount int64
				db.Default.Session().Model(&model.User{}).
					Where("role_id = ? AND active = ? AND id != ?", user.RoleID, true, id).
					Count(&adminCount)
				if adminCount == 0 {
					return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "无法禁用: 系统中至少需要一个启用的管理员"})
				}
			}
			updates["active"] = *req.Active
		}

		if req.Password != "" {
			if err := tool.CheckPassword(req.Password); err != nil {
				return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": err.Error()})
			}
			updates["password"] = tool.NewPassword(req.Password)
		}

		if len(updates) == 0 {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "没有需要更新的字段"})
		}

		if err := db.Default.Session().Model(&user).Updates(updates).Error; err != nil {
			log.Error("handler.AdminUpdateUser: %s", err.Error())
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "更新失败"})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{"data": toUserResp(user, currentRole)})
	}
}

func AdminDeleteUser() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		id, err := cast.ToUintE(c.Param("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "无效的用户ID"})
		}

		session := c.Locals("user").(*model.Session)
		if session.UserID == id {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "不能删除自己的账号"})
		}

		var user model.User
		if err := db.Default.Session().First(&user, id).Error; err != nil {
			return c.Status(http.StatusNotFound).JSON(map[string]string{"msg": "用户不存在"})
		}

		// Prevent deleting the last admin: check via role name
		var userRole model.Role
		if err := db.Default.Session().First(&userRole, user.RoleID).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "查询角色失败"})
		}

		if userRole.Name == model.RoleAdmin {
			var adminCount int64
			db.Default.Session().Model(&model.User{}).
				Where("role_id = ? AND id != ?", user.RoleID, id).
				Count(&adminCount)
			if adminCount == 0 {
				return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "无法删除最后一个管理员"})
			}
		}

		if err := db.Default.Session().Delete(&user).Error; err != nil {
			log.Error("handler.AdminDeleteUser: %s", err.Error())
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "删除失败"})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{"data": "ok"})
	}
}

func AdminListRoles() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		var roles []model.Role
		if err := db.Default.Session().Find(&roles).Error; err != nil {
			log.Error("handler.AdminListRoles: %s", err.Error())
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "查询失败"})
		}
		return c.Status(http.StatusOK).JSON(map[string]any{"data": roles})
	}
}
