package opt

import "path/filepath"

const (
	Meta = ".meta."
)

func FilePath(code string) string {
	return filepath.Join(Cfg.DataPath, code)
}

func MetaPath(code string) string {
	return filepath.Join(Cfg.DataPath, Meta+code)
}
