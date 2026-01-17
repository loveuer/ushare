package handler

import (
	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/static"
	"io"
	"io/fs"
	"net/http"
	"strings"
)

func ServeFrontend() nf.HandlerFunc {
	assets := static.Frontend()

	return func(c *nf.Ctx) error {
		path := strings.TrimPrefix(c.Path(), "/")
		if path == "" || path == "/" {
			path = "index.html"
		}

		file, err := assets.Open(path)
		if err != nil {
			if err.Error() == "file does not exist" {
				return serveIndex(assets, c)
			}
			return c.SendStatus(http.StatusNotFound)
		}
		defer file.Close()

		stat, err := file.Stat()
		if err != nil {
			return c.SendStatus(http.StatusInternalServerError)
		}

		if stat.IsDir() {
			return serveIndex(assets, c)
		}

		io.Copy(c.Writer, file)
		return nil
	}
}

func ServeFrontendMiddleware() nf.HandlerFunc {
	assets := static.Frontend()

	return func(c *nf.Ctx) error {
		path := c.Path()

		if strings.HasPrefix(path, "/api") || strings.HasPrefix(path, "/ushare") {
			return c.Next()
		}

		filePath := strings.TrimPrefix(path, "/")
		if filePath == "" || filePath == "/" {
			filePath = "index.html"
		}

		file, err := assets.Open(filePath)
		if err != nil {
			return serveIndex(assets, c)
		}
		defer file.Close()

		stat, err := file.Stat()
		if err != nil {
			return c.SendStatus(http.StatusInternalServerError)
		}

		if stat.IsDir() {
			return serveIndex(assets, c)
		}

		c.SetHeader("Content-Type", getContentType(filePath))
		io.Copy(c.Writer, file)
		return nil
	}
}

func serveIndex(assets fs.FS, c *nf.Ctx) error {
	index, err := assets.Open("index.html")
	if err != nil {
		log.Error("failed to open index.html: %v", err)
		return c.SendStatus(http.StatusInternalServerError)
	}
	defer index.Close()

	c.SetHeader("Content-Type", "text/html; charset=utf-8")
	io.Copy(c.Writer, index)
	return nil
}

func getContentType(path string) string {
	if strings.HasSuffix(path, ".html") {
		return "text/html; charset=utf-8"
	}
	if strings.HasSuffix(path, ".css") {
		return "text/css; charset=utf-8"
	}
	if strings.HasSuffix(path, ".js") {
		return "application/javascript; charset=utf-8"
	}
	if strings.HasSuffix(path, ".png") {
		return "image/png"
	}
	if strings.HasSuffix(path, ".jpg") || strings.HasSuffix(path, ".jpeg") {
		return "image/jpeg"
	}
	if strings.HasSuffix(path, ".svg") {
		return "image/svg+xml"
	}
	return "application/octet-stream"
}
