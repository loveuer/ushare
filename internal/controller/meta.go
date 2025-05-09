package controller

import (
	"context"
	"fmt"
	"github.com/loveuer/nf/nft/log"
	"github.com/loveuer/ushare/internal/opt"
	gonanoid "github.com/matoous/go-nanoid/v2"
	"io"
	"os"
	"sync"
	"time"
)

type metaInfo struct {
	f      *os.File
	name   string
	create time.Time
	last   time.Time
	size   int64
	cursor int64
	ip     string
}

func (m *metaInfo) generateMeta(code string) error {
	content := fmt.Sprintf("filename=%s\ncreated_at=%d\nsize=%d\nuploader_ip=%s",
		m.name, m.create.UnixMilli(), m.size, m.ip,
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

func (m *meta) New(size int64, filename, ip string) (string, error) {
	now := time.Now()
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

	m.m[code] = &metaInfo{f: f, name: filename, last: now, size: size, cursor: 0, create: now, ip: ip}

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

func (m *meta) Start(ctx context.Context) {
	ticker := time.NewTicker(time.Minute)
	m.ctx = ctx

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case now := <-ticker.C:
				for code, info := range m.m {
					if now.Sub(info.last) > 1*time.Minute {
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
}
