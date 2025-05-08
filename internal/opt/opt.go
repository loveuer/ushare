package opt

type config struct {
	Debug    bool
	Address  string
	DataPath string
	Auth     bool
}

var (
	Cfg = &config{}
)
