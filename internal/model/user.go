package model

type User struct {
	Id       int    `json:"id"`
	Username string `json:"username"`
	Key      string `json:"key"`
	Password string `json:"-"`
	LoginAt  int64  `json:"login_at"`
	Token    string `json:"token"`
}
