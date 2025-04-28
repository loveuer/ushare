package opt

type config struct {
	Debug    bool
	Address  string
	DataPath string
}

var (
	Cfg = &config{}
)
