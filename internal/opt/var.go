package opt

import "path/filepath"

const (
	Meta              = ".meta."
	HeaderSize        = "X-File-Size"
	HeaderMaxDownload = "X-Max-Downloads"
	HeaderExpiresIn   = "X-Expires-In"
	CodeLength        = 8

	// MinExpiresIn is the minimum allowed expiry in seconds (30s for testing).
	MinExpiresIn = 30
	// DefaultExpiresIn is the default expiry in seconds (8 hours).
	DefaultExpiresIn = 8 * 3600
	// DefaultMaxDownloads is the default max download count (0 = unlimited).
	DefaultMaxDownloads = 3
)

func FilePath(code string) string {
	return filepath.Join(Cfg.DataPath, code)
}

func MetaPath(code string) string {
	return filepath.Join(Cfg.DataPath, Meta+code)
}
