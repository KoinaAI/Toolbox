// Package httpapi exposes the tool directory and serves the built frontend.
package httpapi

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	"strings"
	"unicode/utf8"

	"github.com/KoinaAI/Toolbox/internal/catalog"
)

// New builds a same-origin handler. A missing frontend build returns 503, never a fake page.
func New(c catalog.Catalog, staticDir string) http.Handler {
	mux := http.NewServeMux()
	networkRoutes(mux)
	writeJSON := func(w http.ResponseWriter, r *http.Request, value any) {
		payload, err := json.Marshal(value)
		if err != nil {
			fail(w, http.StatusInternalServerError, "internal_error", "响应编码失败")
			return
		}
		etag := fmt.Sprintf(`"%x"`, sha256.Sum256(payload))
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("ETag", etag)
		for _, candidate := range strings.Split(r.Header.Get("If-None-Match"), ",") {
			if strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(candidate), "W/")) == etag || strings.TrimSpace(candidate) == "*" {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
		_, _ = w.Write(payload)
	}
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, r, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /api/v1/catalog", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, r, c) })
	mux.HandleFunc("GET /api/v1/categories", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, r, map[string]any{"items": c.Categories}) })
	mux.HandleFunc("GET /api/v1/tools", func(w http.ResponseWriter, r *http.Request) {
		category, query := r.URL.Query().Get("category"), strings.TrimSpace(r.URL.Query().Get("q"))
		if utf8.RuneCountInString(query) > 128 {
			fail(w, 400, "invalid_query", "搜索词最多 128 个字符")
			return
		}
		if category != "" {
			found := false
			for _, v := range c.Categories {
				if v.ID == category {
					found = true
					break
				}
			}
			if !found {
				fail(w, 400, "invalid_category", "分类不存在")
				return
			}
		}
		items := c.Filter(category, query)
		writeJSON(w, r, map[string]any{"items": items, "total": len(items)})
	})
	mux.HandleFunc("GET /api/v1/tools/{id}", func(w http.ResponseWriter, r *http.Request) {
		t, ok := c.Find(r.PathValue("id"))
		if !ok {
			fail(w, 404, "tool_not_found", "工具不存在")
			return
		}
		writeJSON(w, r, t)
	})
	mux.HandleFunc("GET /api/", func(w http.ResponseWriter, r *http.Request) { fail(w, 404, "not_found", "接口不存在") })
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		// OpenRoot confines symlink resolution as well as ordinary path traversal.
		staticRoot, err := os.OpenRoot(staticDir)
		if err != nil {
			fail(w, 503, "frontend_not_built", "前端尚未构建，请运行 npm run build")
			return
		}
		defer staticRoot.Close()
		root := staticRoot.FS()
		files := http.FileServer(http.FS(root))
		clean := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		if strings.HasPrefix(clean, "assets/") {
			if info, err := fs.Stat(root, clean); err != nil || info.IsDir() {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			files.ServeHTTP(w, r)
			return
		}
		if clean != "." && clean != "" {
			if info, err := fs.Stat(root, clean); err == nil && !info.IsDir() {
				files.ServeHTTP(w, r)
				return
			}
		}
		// Only known client routes may fall back to index.html; missing assets stay 404.
		isRoute := clean == "." || clean == "" || clean == "favorites" || clean == "recent" || clean == "about" || strings.HasPrefix(clean, "category/") || strings.HasPrefix(clean, "tools/")
		if !isRoute {
			http.NotFound(w, r)
			return
		}
		index, err := fs.ReadFile(root, "index.html")
		if err != nil {
			fail(w, 503, "frontend_not_built", "前端尚未构建，请运行 npm run build")
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache")
		_, _ = w.Write(index)
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Frame-Options", "DENY")
		mux.ServeHTTP(w, r)
	})
}

func fail(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{"error": map[string]string{"code": code, "message": message}})
}
