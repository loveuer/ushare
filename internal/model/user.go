package model

import "time"

// User is the GORM database model for persistent user storage.
type User struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	RoleID    uint      `gorm:"not null" json:"role_id"`
	Active    bool      `gorm:"default:true" json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Session is the in-memory representation of an authenticated user.
// It is created on login and stored in the UserManager session map.
type Session struct {
	UserID      uint     `json:"user_id"`
	Username    string   `json:"username"`
	Role        string   `json:"role"`
	RoleLabel   string   `json:"role_label"`
	Permissions []string `json:"permissions"`
	LoginAt     int64    `json:"login_at"`
	Token       string   `json:"token"`
}
