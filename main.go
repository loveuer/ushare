package main

import (
	"context"
	"github.com/loveuer/ushare/internal/api"
	"os/signal"
	"syscall"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	api.Start(ctx)

	<-ctx.Done()
}
