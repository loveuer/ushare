package model

import "time"

// Token is a personal API token for programmatic file upload.
// Token values are prefixed with "ust_" to distinguish them from session tokens.
type Token struct {
	ID         uint       `gorm:"primarykey" json:"id"`
	UserID     uint       `gorm:"not null;index" json:"user_id"`
	Name       string     `gorm:"not null" json:"name"`
	Token      string     `gorm:"uniqueIndex;not null" json:"-"`
	CreatedAt  time.Time  `json:"created_at"`
	LastUsedAt *time.Time `json:"last_used_at"`
	ExpiresAt  *time.Time `json:"expires_at"`
}

// TokenPrefix is the prefix for all API token values.
const TokenPrefix = "ust_"
