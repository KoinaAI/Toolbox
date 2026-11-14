package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func toolRequest(path string, payload any) *http.Request {
	data, _ := json.Marshal(payload)
	r := httptest.NewRequest("POST", path, bytes.NewReader(data))
	r.Header.Set("Content-Type", "application/json")
	return r
}

func TestNetworkInputBoundaries(t *testing.T) {
	mux := http.NewServeMux()
	networkRoutes(mux)
	for _, item := range []struct {
		path    string
		payload any
		status  int
	}{
		{"/api/v1/tools/dns/query", map[string]string{"name": "https://example.com", "type": "A"}, 400},
		{"/api/v1/tools/ip/query", map[string]string{"ip": "not-an-ip"}, 400},
		{"/api/v1/tools/ip/query", map[string]string{"ip": "127.0.0.1"}, 200},
		{"/api/v1/tools/http-client/request", map[string]string{"url": "file:///etc/passwd", "method": "GET"}, 400},
		{"/api/v1/tools/http-client/request", map[string]string{"url": "https://example.com", "method": "DELETE"}, 400},
		{"/api/v1/tools/http-client/request", map[string]any{"url": "https://example.com", "method": "GET", "headers": map[string]string{"Host": "localhost"}}, 400},
		{"/api/v1/tools/http-client/request", map[string]string{"url": "http://127.0.0.1:1", "method": "GET"}, 502},
	} {
		t.Run(item.path, func(t *testing.T) {
			w := httptest.NewRecorder()
			mux.ServeHTTP(w, toolRequest(item.path, item.payload))
			if w.Code != item.status {
				t.Fatalf("got %d: %s", w.Code, w.Body.String())
			}
		})
	}
}

func TestHTTPClientResponseLimitsAndMethods(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Error("method changed")
		}
		w.Header().Set("X-Observed", "true")
		w.WriteHeader(201)
		_, _ = w.Write([]byte(strings.Repeat("x", (1<<20)+20)))
	}))
	defer upstream.Close()
	w := httptest.NewRecorder()
	httpRequest(w, toolRequest("/", map[string]any{"url": upstream.URL, "method": "POST", "body": "hello", "headers": map[string]string{"Content-Type": "text/plain"}}), upstream.Client())
	var result struct {
		Status    int
		Body      string
		Truncated bool
	}
	if w.Code != 200 || json.Unmarshal(w.Body.Bytes(), &result) != nil {
		t.Fatalf("%d %s", w.Code, w.Body.String())
	}
	if result.Status != 201 || !result.Truncated || len(result.Body) != 1<<20 {
		t.Fatalf("response bounds failed: %d %t %d", result.Status, result.Truncated, len(result.Body))
	}
}
