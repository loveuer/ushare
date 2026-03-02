package handler

import (
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/loveuer/nf"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/controller"
	"github.com/loveuer/ushare/internal/opt"
	"github.com/pkg/errors"
	"github.com/spf13/cast"
)

func Fetch() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		code := c.Param("code")
		log.Debug("handler.Fetch: code = %s", code)

		if _, err := os.Stat(opt.MetaPath(code)); err != nil {
			if errors.Is(err, os.ErrNotExist) {
				return c.Status(http.StatusNotFound).JSON(map[string]string{"msg": "文件不存在"})
			}
			return c.SendStatus(http.StatusInternalServerError)
		}

		info, err := controller.MetaManager.CheckAndIncrDownload(code)
		if err != nil {
			return c.Status(http.StatusGone).JSON(map[string]string{"msg": err.Error()})
		}

		c.SetHeader("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, info.Filename))
		http.ServeFile(c.Writer, c.Request, opt.FilePath(code))

		return nil
	}
}

func ShareNew() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		filename := strings.TrimSpace(c.Param("filename"))
		if filename == "" {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "filename required"})
		}

		size, err := cast.ToInt64E(c.Get(opt.HeaderSize))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "miss header: " + opt.HeaderSize})
		}

		maxDownloads := opt.DefaultMaxDownloads
		if v := c.Get(opt.HeaderMaxDownload); v != "" {
			if n, err := cast.ToIntE(v); err == nil && n >= 0 {
				maxDownloads = n
			}
		}

		expiresIn := int64(opt.DefaultExpiresIn)
		if v := c.Get(opt.HeaderExpiresIn); v != "" {
			if n, err := cast.ToInt64E(v); err == nil && n >= opt.MinExpiresIn {
				expiresIn = n
			}
		}

		code, err := controller.MetaManager.New(size, filename, c.IP(), maxDownloads, expiresIn)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": ""})
		}

		return c.Status(http.StatusOK).JSON(map[string]string{"code": code})
	}
}

func ShareUpload() nf.HandlerFunc {
	rangeValidator := regexp.MustCompile(`^bytes=\d+-\d+$`)
	return func(c *nf.Ctx) error {
		code := strings.TrimSpace(c.Param("code"))
		if len(code) != opt.CodeLength {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "invalid file code"})
		}

		log.Debug("handler.ShareUpload: code = %s", code)

		ranger := strings.TrimSpace(c.Get("Range"))
		if ranger == "" {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "miss header: Range"})
		}

		log.Debug("handler.ShareUpload: code = %s, ranger = %s", code, ranger)

		if !rangeValidator.MatchString(ranger) {
			log.Warn("handler.ShareUpload: invalid range, ranger = %s", ranger)
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "Range invalid(1)"})
		}

		strs := strings.Split(strings.TrimPrefix(ranger, "bytes="), "-")
		if len(strs) != 2 {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "Range invalid(2)"})
		}

		start, err := cast.ToInt64E(strs[0])
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "Range invalid(3)"})
		}

		end, err := cast.ToInt64E(strs[1])
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "Range invalid(4)"})
		}

		log.Debug("handler.ShareUpload: code = %s, start = %d, end = %d", code, start, end)

		total, cursor, err := controller.MetaManager.Write(code, start, end, c.Request.Body)
		if err != nil {
			log.Error("handler.ShareUpload: write error: %s", err)
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": ""})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{"size": total, "cursor": cursor})
	}
}

// ShareAPIUpload handles one-step file upload via API token.
// PUT /api/v1/upload/:filename
// Optional headers: X-Max-Downloads, X-Expires-In (seconds).
func ShareAPIUpload() nf.HandlerFunc {
	return func(c *nf.Ctx) error {
		filename := strings.TrimSpace(c.Param("filename"))
		if filename == "" {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "filename required"})
		}

		size, err := cast.ToInt64E(c.Request.ContentLength)
		if err != nil || size <= 0 {
			return c.Status(http.StatusBadRequest).JSON(map[string]string{"msg": "Content-Length header required"})
		}

		maxDownloads := opt.DefaultMaxDownloads
		if v := c.Get(opt.HeaderMaxDownload); v != "" {
			if n, err := cast.ToIntE(v); err == nil && n >= 0 {
				maxDownloads = n
			}
		}

		expiresIn := int64(opt.DefaultExpiresIn)
		if v := c.Get(opt.HeaderExpiresIn); v != "" {
			if n, err := cast.ToInt64E(v); err == nil && n >= opt.MinExpiresIn {
				expiresIn = n
			}
		}

		code, err := controller.MetaManager.New(size, filename, c.IP(), maxDownloads, expiresIn)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "create upload failed"})
		}

		_, _, err = controller.MetaManager.Write(code, 0, size-1, c.Request.Body)
		if err != nil {
			log.Error("handler.ShareAPIUpload: write error: %s", err)
			return c.Status(http.StatusInternalServerError).JSON(map[string]string{"msg": "upload failed"})
		}

		return c.Status(http.StatusOK).JSON(map[string]any{
			"status": 200,
			"data":   map[string]string{"code": code},
		})
	}
}
