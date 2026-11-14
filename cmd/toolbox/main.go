// Toolbox serves the directory API and frontend from a single origin.
package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/KoinaAI/Toolbox/internal/catalog"
	"github.com/KoinaAI/Toolbox/internal/httpapi"
)

func main() {
	healthcheck := flag.Bool("healthcheck", false, "check the local HTTP service and exit")
	flag.Parse()
	addr := env("LISTEN_ADDR", ":8080")
	if *healthcheck {
		client := http.Client{Timeout: 3 * time.Second}
		response, err := client.Get(env("HEALTHCHECK_URL", "http://127.0.0.1:8080/healthz"))
		if err != nil {
			os.Exit(1)
		}
		defer response.Body.Close()
		if response.StatusCode != http.StatusOK {
			os.Exit(1)
		}
		return
	}
	c, err := catalog.Default()
	if err != nil {
		slog.Error("invalid catalog", "error", err)
		os.Exit(1)
	}
	server := &http.Server{Addr: addr, Handler: httpapi.New(c, env("STATIC_DIR", "web/dist")), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 1 << 20}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	done := make(chan error, 1)
	go func() {
		slog.Info("toolbox listening", "address", addr, "tools", len(c.Tools))
		done <- server.ListenAndServe()
	}()
	select {
	case err := <-done:
		if !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdown); err != nil {
			slog.Error("shutdown failed", "error", err)
			_ = server.Close()
			os.Exit(1)
		}
		slog.Info("toolbox stopped")
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
