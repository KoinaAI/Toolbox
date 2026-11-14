package httpapi

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/KoinaAI/Toolbox/internal/catalog"
)

func TestBoundaryStaticSymlinkOutsideRoot(t *testing.T) {
	dir := t.TempDir()
	staticDir := filepath.Join(dir, "public")
	if err := os.MkdirAll(filepath.Join(staticDir, "assets"), 0700); err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(dir, "outside.txt")
	const marker = "synthetic file outside the static root"
	if err := os.WriteFile(outside, []byte(marker), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(staticDir, "assets", "outside.txt")); err != nil {
		t.Fatal(err)
	}

	response := httptest.NewRecorder()
	New(catalog.Catalog{}, staticDir).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/assets/outside.txt", nil))
	if response.Code != http.StatusNotFound {
		t.Fatalf("GET /assets/outside.txt: want 404 for a symlink outside the static root; got status=%d body=%q cache-control=%q", response.Code, response.Body.String(), response.Header().Get("Cache-Control"))
	}
}
