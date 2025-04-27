package opt

type config struct {
	Debug   bool
	Address string
}

var (
	Cfg = &config{}
)
