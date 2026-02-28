package controller

import (
	"strings"
	"time"

	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/pkg/db"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"github.com/pkg/errors"
)

type tokenManager struct{}

var TokenManager = &tokenManager{}

// List returns all tokens belonging to a user (token value is not exposed).
func (tm *tokenManager) List(userID uint) ([]model.Token, error) {
	var tokens []model.Token
	if err := db.Default.Session().Where("user_id = ?", userID).Order("created_at desc").Find(&tokens).Error; err != nil {
		return nil, errors.Wrap(err, "list tokens failed")
	}
	return tokens, nil
}

// Create generates a new API token for the given user and returns the full token value (only shown once).
func (tm *tokenManager) Create(userID uint, name string) (*model.Token, string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, "", errors.New("token 名称不能为空")
	}

	rawToken := model.TokenPrefix + tool.RandomString(32)

	t := &model.Token{
		UserID: userID,
		Name:   name,
		Token:  rawToken,
	}

	if err := db.Default.Session().Create(t).Error; err != nil {
		return nil, "", errors.Wrap(err, "create token failed")
	}

	return t, rawToken, nil
}

// Delete removes a token by ID, only if it belongs to the given user.
func (tm *tokenManager) Delete(userID uint, tokenID uint) error {
	result := db.Default.Session().
		Where("id = ? AND user_id = ?", tokenID, userID).
		Delete(&model.Token{})

	if result.Error != nil {
		return errors.Wrap(result.Error, "delete token failed")
	}

	if result.RowsAffected == 0 {
		return errors.New("token 不存在或无权限删除")
	}

	return nil
}

// Verify looks up a DB API token and returns a Session if valid.
func (tm *tokenManager) Verify(rawToken string) (*model.Session, error) {
	var t model.Token
	err := db.Default.Session().
		Where("token = ?", rawToken).
		Preload("User").
		Preload("User.Role").
		First(&t).Error

	if err != nil {
		return nil, errors.New("无效的 API Token")
	}

	if t.ExpiresAt != nil && time.Now().After(*t.ExpiresAt) {
		return nil, errors.New("API Token 已过期")
	}

	// Update last_used_at asynchronously
	now := time.Now()
	go db.Default.Session().Model(&t).Update("last_used_at", now) //nolint:errcheck

	session := &model.Session{
		UserID:      t.User.ID,
		Username:    t.User.Username,
		Role:        t.User.Role.Name,
		RoleLabel:   t.User.Role.Label,
		Permissions: t.User.Role.PermissionList(),
		LoginAt:     now.Unix(),
		Token:       rawToken,
	}

	return session, nil
}
