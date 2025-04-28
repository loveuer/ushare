package model

type Meta struct {
	Filename   string `json:"filename" mapstructure:"filename"`
	CreatedAt  int64  `json:"created_at" mapstructure:"created_at"`
	Size       int64  `json:"size" mapstructure:"size"`
	UploaderIp string `json:"uploader_ip" mapstructure:"uploader_ip"`
}
