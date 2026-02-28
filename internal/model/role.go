package model

import (
	"strings"
	"time"
)

const (
	PermUserManage  = "user_manage"
	PermUpload      = "upload"
	PermTokenManage = "token_manage"

	RoleAdmin = "admin"
	RoleUser  = "user"
)

type Role struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	Name        string    `gorm:"uniqueIndex;not null" json:"name"`
	Label       string    `gorm:"not null" json:"label"`
	Permissions string    `gorm:"not null" json:"permissions"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (r *Role) HasPermission(perm string) bool {
	for _, p := range r.PermissionList() {
		if p == perm {
			return true
		}
	}
	return false
}

func (r *Role) PermissionList() []string {
	list := make([]string, 0)
	for _, p := range strings.Split(r.Permissions, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			list = append(list, p)
		}
	}
	return list
}
