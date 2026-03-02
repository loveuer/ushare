package controller

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	gonanoid "github.com/matoous/go-nanoid/v2"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/model"
	"github.com/loveuer/ushare/internal/opt"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
)

type metaInfo struct {
	f            *os.File
	name         string
	create       time.Time
	last         time.Time
	size         int64
	cursor       int64
	user         string
	maxDownloads int
	expiresAt    int64
}

func (m *metaInfo) generateMeta(code string) error {
	content := fmt.Sprintf(
		"filename=%s\ncreated_at=%d\nsize=%d\nuploader=%s\nmax_downloads=%d\nexpires_at=%d\ndownloads=0",
		m.name, m.create.UnixMilli(), m.size, m.user, m.maxDownloads, m.expiresAt,
	)
	return os.WriteFile(opt.MetaPath(code), []byte(content), 0644)
}

type meta struct {
	sync.Mutex
	ctx context.Context
	m   map[string]*metaInfo
}

var (
	MetaManager = &meta{m: make(map[string]*metaInfo)}
)

const letters = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// New creates a new upload session.
// maxDownloads: 0 = unlimited; expiresIn: seconds from now (minimum opt.MinExpiresIn).
func (m *meta) New(size int64, filename, ip string, maxDownloads int, expiresIn int64) (string, error) {
	now := time.Now()

	if expiresIn < opt.MinExpiresIn {
		expiresIn = opt.DefaultExpiresIn
	}

	if maxDownloads < 0 {
		maxDownloads = 0
	}

	code, err := gonanoid.Generate(letters, opt.CodeLength)
	if err != nil {
		return "", err
	}

	f, err := os.Create(opt.FilePath(code))
	if err != nil {
		return "", err
	}

	if err = f.Truncate(size); err != nil {
		f.Close()
		return "", err
	}

	m.Lock()
	defer m.Unlock()

	m.m[code] = &metaInfo{
		f:            f,
		name:         filename,
		last:         now,
		size:         size,
		cursor:       0,
		create:       now,
		user:         ip,
		maxDownloads: maxDownloads,
		expiresAt:    now.Unix() + expiresIn,
	}

	return code, nil
}

func (m *meta) Write(code string, start, end int64, reader io.Reader) (total, cursor int64, err error) {
	m.Lock()
	defer m.Unlock()

	if _, ok := m.m[code]; !ok {
		return 0, 0, fmt.Errorf("code not exist")
	}

	w, err := io.CopyN(m.m[code].f, reader, end-start+1)
	if err != nil {
		return 0, 0, err
	}

	m.m[code].cursor += w
	m.m[code].last = time.Now()

	total = m.m[code].size
	cursor = m.m[code].cursor

	if m.m[code].cursor == m.m[code].size {
		defer delete(m.m, code)
		if err = m.m[code].generateMeta(code); err != nil {
			return 0, 0, err
		}
	}

	return total, cursor, nil
}

// CheckAndIncrDownload reads the meta file, validates expiry and download limit,
// increments the download counter, and writes the meta file back.
// Returns the meta on success, or an error if the file is unavailable.
func (m *meta) CheckAndIncrDownload(code string) (*model.Meta, error) {
	m.Lock()
	defer m.Unlock()

	metaPath := opt.MetaPath(code)

	v := viper.New()
	v.SetConfigFile(metaPath)
	v.SetConfigType("env")
	if err := v.ReadInConfig(); err != nil {
		return nil, errors.New("文件不存在或已过期")
	}

	info := new(model.Meta)
	if err := v.Unmarshal(info); err != nil {
		return nil, errors.New("文件元数据损坏")
	}

	now := time.Now().Unix()

	// Check expiry
	if info.ExpiresAt > 0 && now > info.ExpiresAt {
		// Clean up expired files
		go func() {
			_ = os.RemoveAll(opt.FilePath(code))
			_ = os.RemoveAll(metaPath)
		}()
		return nil, errors.New("文件已过期")
	}

	// Check download limit
	if info.MaxDownloads > 0 && info.Downloads >= info.MaxDownloads {
		return nil, errors.New("文件下载次数已达上限")
	}

	// Increment downloads and write back
	info.Downloads++
	content := fmt.Sprintf(
		"filename=%s\ncreated_at=%d\nsize=%d\nuploader=%s\nmax_downloads=%d\nexpires_at=%d\ndownloads=%d",
		info.Filename, info.CreatedAt, info.Size, info.Uploader,
		info.MaxDownloads, info.ExpiresAt, info.Downloads,
	)
	if err := os.WriteFile(metaPath, []byte(content), 0644); err != nil {
		log.Warn("meta.CheckAndIncrDownload: write back failed: %s", err.Error())
	}

	// If this was the last allowed download, clean up after serving
	if info.MaxDownloads > 0 && info.Downloads >= info.MaxDownloads {
		go func() {
			time.Sleep(5 * time.Second)
			_ = os.RemoveAll(opt.FilePath(code))
			_ = os.RemoveAll(metaPath)
		}()
	}

	return info, nil
}

func (m *meta) Start(ctx context.Context) {
	ticker := time.NewTicker(time.Minute)
	m.ctx = ctx

	if err := os.MkdirAll(opt.Cfg.DataPath, 0644); err != nil {
		log.Fatal("controller.MetaManager.Start: mkdir datapath failed, path = %s, err = %s", opt.Cfg.DataPath, err.Error())
	}

	// Clean uploads with no activity for 2 minutes
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case now := <-ticker.C:
				for code, info := range m.m {
					if now.Sub(info.last) > 2*time.Minute {
						m.Lock()
						if err := info.f.Close(); err != nil {
							log.Warn("handler.Meta: [timer] close file failed, file = %s, err = %s", opt.FilePath(code), err.Error())
						}
						if err := os.RemoveAll(opt.FilePath(code)); err != nil {
							log.Warn("handler.Meta: [timer] remove file failed, file = %s, err = %s", opt.FilePath(code), err.Error())
						}
						delete(m.m, code)
						m.Unlock()
						log.Warn("MetaController: code timeout removed, code = %s", code)
					}
				}
			}
		}
	}()

	// Clean expired files by walking the data directory
	go func() {
		if opt.Cfg.CleanInterval <= 0 {
			log.Warn("meta.Clean: no clean interval set, plz clean manual!!!")
			return
		}

		ticker := time.NewTicker(5 * time.Minute)
		duration := time.Duration(opt.Cfg.CleanInterval) * time.Hour

		for {
			select {
			case <-ctx.Done():
				return
			case now := <-ticker.C:
				_ = filepath.Walk(opt.Cfg.DataPath, func(path string, info os.FileInfo, err error) error {
					if info == nil {
						return nil
					}
					if info.IsDir() {
						return nil
					}

					name := filepath.Base(info.Name())
					if !strings.HasPrefix(name, ".meta.") {
						return nil
					}

					v := viper.New()
					v.SetConfigFile(path)
					v.SetConfigType("env")
					if err = v.ReadInConfig(); err != nil {
						return nil
					}

					mi := new(model.Meta)
					if err = v.Unmarshal(mi); err != nil {
						return nil
					}

					code := strings.TrimPrefix(name, ".meta.")

					// Remove if past explicit expiry
					if mi.ExpiresAt > 0 && now.Unix() > mi.ExpiresAt {
						log.Debug("controller.meta: file expired, code = %s", code)
						_ = os.RemoveAll(opt.FilePath(code))
						_ = os.RemoveAll(path)
						return nil
					}

					// Remove if past global clean interval
					if now.Sub(time.UnixMilli(mi.CreatedAt)) > duration {
						log.Debug("controller.meta: file out of date, code = %s", code)
						_ = os.RemoveAll(opt.FilePath(code))
						_ = os.RemoveAll(path)
					}

					return nil
				})
			}
		}
	}()
}
