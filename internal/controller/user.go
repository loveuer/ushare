package controller

import (
	"context"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/opt"
	"github.com/loveuer/ushare/internal/pkg/tool"
	"github.com/pkg/errors"
	"sync"
	"time"
)

type userManager struct {
	sync.Mutex
	ctx context.Context
	um  map[string]*model.User
}

func (um *userManager) Login(username string, password string) (*model.User, error) {
	var (
		now = time.Now()
	)

	if username != "admin" {
		return nil, errors.New("账号或密码错误")
	}

	if !tool.ComparePassword(password, opt.Cfg.Auth) {
		return nil, errors.New("账号或密码错误")
	}

	op := &model.User{
		Id:       1,
		Username: username,
		LoginAt:  now.Unix(),
		Token:    tool.RandomString(32),
	}

	um.Lock()
	defer um.Unlock()
	um.um[op.Token] = op

	return op, nil
}

func (um *userManager) Verify(token string) (*model.User, error) {
	um.Lock()
	defer um.Unlock()

	op, ok := um.um[token]
	if !ok {
		return nil, errors.New("未登录或凭证已失效, 请重新登录")
	}

	return op, nil
}

func (um *userManager) Start(ctx context.Context) {
	um.ctx = ctx

	go func() {

		ticker := time.NewTicker(time.Minute)

		for {
			select {
			case <-um.ctx.Done():
				return
			case now := <-ticker.C:
				um.Lock()
				for _, op := range um.um {
					if now.Sub(time.UnixMilli(op.LoginAt)) > 8*time.Hour {
						delete(um.um, op.Token)
					}
				}
				um.Unlock()
			}
		}
	}()
}

var (
	UserManager = &userManager{
		um: make(map[string]*model.User),
	}
)
