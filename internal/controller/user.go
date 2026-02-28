package controller

import (
	"context"
	"strings"
	"sync"
	"time"

	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/opt"
	"github.com/loveuer/ushare/internal/pkg/db"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"github.com/pkg/errors"
)

type userManager struct {
	sync.Mutex
	ctx      context.Context
	sessions map[string]*model.Session
}

var UserManager = &userManager{
	sessions: make(map[string]*model.Session),
}

func (um *userManager) seed(ctx context.Context) error {
	// Seed default roles if they don't exist
	defaultRoles := []model.Role{
		{
			Name:        model.RoleAdmin,
			Label:       "管理员",
			Permissions: strings.Join([]string{model.PermUserManage, model.PermUpload, model.PermTokenManage}, ","),
		},
		{
			Name:        model.RoleUser,
			Label:       "用户",
			Permissions: model.PermUpload,
		},
	}

	for i := range defaultRoles {
		role := &defaultRoles[i]
		var existing model.Role
		if err := db.Default.Session(ctx).Where("name = ?", role.Name).First(&existing).Error; err != nil {
			if err := db.Default.Session(ctx).Create(role).Error; err != nil {
				return errors.Wrap(err, "seed role failed")
			}
			log.Debug("controller.userManager.seed: created role %s", role.Name)
		}
	}

	// Seed default admin user only if no users exist
	var count int64
	db.Default.Session(ctx).Model(&model.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	var adminRole model.Role
	if err := db.Default.Session(ctx).Where("name = ?", model.RoleAdmin).First(&adminRole).Error; err != nil {
		return errors.Wrap(err, "get admin role failed")
	}

	username := opt.Cfg.Username
	if username == "" {
		username = "admin"
	}

	// opt.Cfg.Password is already hashed by opt.Init(); store it directly.
	adminUser := &model.User{
		Username: username,
		Password: opt.Cfg.Password,
		RoleID:   adminRole.ID,
		Active:   true,
	}

	if err := db.Default.Session(ctx).Create(adminUser).Error; err != nil {
		return errors.Wrap(err, "seed admin user failed")
	}

	log.Debug("controller.userManager.seed: created admin user %s", username)
	return nil
}

func (um *userManager) Login(username, password string) (*model.Session, error) {
	now := time.Now()

	user := new(model.User)
	if err := db.Default.Session().
		Where("username = ? AND active = ?", username, true).
		First(user).Error; err != nil {
		return nil, errors.New("账号或密码错误")
	}

	if !tool.ComparePassword(password, user.Password) {
		return nil, errors.New("账号或密码错误")
	}

	var role model.Role
	if err := db.Default.Session().First(&role, user.RoleID).Error; err != nil {
		return nil, errors.New("账号角色异常，请联系管理员")
	}

	session := &model.Session{
		UserID:      user.ID,
		Username:    user.Username,
		Role:        role.Name,
		RoleLabel:   role.Label,
		Permissions: role.PermissionList(),
		LoginAt:     now.Unix(),
		Token:       tool.RandomString(32),
	}

	um.Lock()
	defer um.Unlock()
	um.sessions[session.Token] = session

	return session, nil
}

func (um *userManager) Verify(token string) (*model.Session, error) {
	um.Lock()
	defer um.Unlock()

	session, ok := um.sessions[token]
	if !ok {
		return nil, errors.New("未登录或凭证已失效, 请重新登录")
	}

	return session, nil
}

func (um *userManager) Start(ctx context.Context) {
	um.ctx = ctx

	if err := um.seed(ctx); err != nil {
		log.Fatal("controller.userManager.Start: seed failed: %s", err.Error())
	}

	go func() {
		ticker := time.NewTicker(time.Minute)
		for {
			select {
			case <-um.ctx.Done():
				return
			case now := <-ticker.C:
				um.Lock()
				for token, session := range um.sessions {
					if now.Unix()-session.LoginAt > 8*3600 {
						delete(um.sessions, token)
					}
				}
				um.Unlock()
			}
		}
	}()
}
