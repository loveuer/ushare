package opt

import "path/filepath"

const (
	Meta       = ".meta."
	HeaderSize = "X-File-Size"
)

func FilePath(code string) string {
	return filepath.Join(Cfg.DataPath, code)
}

func MetaPath(code string) string {
	return filepath.Join(Cfg.DataPath, Meta+code)
}
