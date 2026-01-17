package static

import (
	"embed"
	"io/fs"
)

//go:embed frontend/dist
var FrontendFS embed.FS

func Frontend() fs.FS {
	sub, _ := fs.Sub(FrontendFS, "frontend/dist")
	return sub
}
