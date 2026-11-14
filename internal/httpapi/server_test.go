package httpapi

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/KoinaAI/Toolbox/internal/catalog"
)

func TestDirectoryHTTPContract(t *testing.T) {
	c, err := catalog.Default()
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("toolbox-app"), 0600); err != nil {
		t.Fatal(err)
	}
	h := New(c, dir)
	for _, tc := range []struct {
		path     string
		status   int
		contains string
	}{
		{"/api/v1/catalog", 200, `"shortDesc"`},
		{"/api/v1/tools?category=development&q=JSON", 200, `"total":1`},
		{"/api/v1/tools?category=missing", 400, `invalid_category`},
		{"/api/v1/tools/missing", 404, `tool_not_found`},
		{"/api/v1/nope", 404, `not_found`},
		{"/api/v1/tools?q=" + strings.Repeat("a", 129), 400, `invalid_query`},
		{"/api/v1/tools?q=nomatch", 200, `"items":[]`},
		{"/tools/json", 200, "toolbox-app"},
		{"/assets/missing.js", 404, "404"},
		{"/missing.js", 404, "404"},
		{"/healthz", 200, `"ok"`},
	} {
		t.Run(tc.path, func(t *testing.T) {
			r := httptest.NewRecorder()
			h.ServeHTTP(r, httptest.NewRequest("GET", tc.path, nil))
			if r.Code != tc.status || !strings.Contains(r.Body.String(), tc.contains) {
				t.Fatalf("got %d %s", r.Code, r.Body.String())
			}
		})
	}
	first := httptest.NewRecorder()
	h.ServeHTTP(first, httptest.NewRequest("GET", "/api/v1/catalog", nil))
	var payload catalog.Catalog
	if err := json.Unmarshal(first.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest("GET", "/api/v1/catalog", nil)
	request.Header.Set("If-None-Match", "W/"+first.Header().Get("ETag"))
	cached := httptest.NewRecorder()
	h.ServeHTTP(cached, request)
	if cached.Code != 304 || cached.Body.Len() != 0 {
		t.Fatal("conditional request failed")
	}
}
