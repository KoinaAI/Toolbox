package httpapi

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/KoinaAI/Toolbox/internal/safehttp"
)

func readToolJSON(w http.ResponseWriter, r *http.Request, value any) bool {
	if strings.Split(r.Header.Get("Content-Type"), ";")[0] != "application/json" {
		fail(w, 415, "invalid_content_type", "请使用 application/json")
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 300<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(value); err != nil {
		fail(w, 400, "invalid_input", "请求 JSON 无效或超过大小限制")
		return false
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		fail(w, 400, "invalid_input", "请求必须只包含一个 JSON 对象")
		return false
	}
	return true
}

func toolJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(value)
}

func networkRoutes(mux *http.ServeMux) {
	client := safehttp.NewClient(12 * time.Second)
	capacity := make(chan struct{}, 8)
	limit := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			select {
			case capacity <- struct{}{}:
				defer func() { <-capacity }()
				next(w, r)
			default:
				fail(w, 429, "busy", "当前任务较多，请稍后重试")
			}
		}
	}
	mux.HandleFunc("POST /api/v1/tools/dns/query", limit(dnsQuery))
	mux.HandleFunc("POST /api/v1/tools/http-client/request", limit(func(w http.ResponseWriter, r *http.Request) { httpRequest(w, r, client) }))
	var mutex sync.Mutex
	type cachedIP struct {
		value   map[string]any
		expires time.Time
	}
	cache := map[string]cachedIP{}
	mux.HandleFunc("POST /api/v1/tools/ip/query", limit(func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			IP string `json:"ip"`
		}
		if !readToolJSON(w, r, &input) {
			return
		}
		ip, err := netip.ParseAddr(strings.TrimSpace(input.IP))
		if err != nil || ip.Zone() != "" {
			fail(w, 400, "invalid_ip", "请输入 IPv4 或 IPv6 地址，不包含端口或区域标识")
			return
		}
		ip = ip.Unmap()
		kind := "IPv6"
		if ip.Is4() {
			kind = "IPv4"
		}
		if !safehttp.PublicIP(ip) {
			toolJSON(w, map[string]any{"ip": ip.String(), "type": kind, "public": false, "message": "专用或特殊用途地址，不向地理信息服务发送查询"})
			return
		}
		key := ip.String()
		mutex.Lock()
		entry, ok := cache[key]
		mutex.Unlock()
		if ok && time.Now().Before(entry.expires) {
			toolJSON(w, entry.value)
			return
		}
		request, _ := http.NewRequestWithContext(r.Context(), "GET", "https://ipwho.is/"+url.PathEscape(key), nil)
		response, err := client.Do(request)
		if err != nil {
			fail(w, 502, "upstream_unavailable", "IP 信息服务连接失败，请稍后重试")
			return
		}
		defer response.Body.Close()
		if response.StatusCode != 200 {
			fail(w, 502, "upstream_unavailable", fmt.Sprintf("IP 信息服务返回 %d，可能已达到共享配额", response.StatusCode))
			return
		}
		var value map[string]any
		if err := json.NewDecoder(io.LimitReader(response.Body, 128<<10)).Decode(&value); err != nil || value["success"] != true {
			fail(w, 502, "upstream_error", "IP 信息服务未返回有效结果")
			return
		}
		value["public"] = true
		value["provider"] = "ipwho.is"
		mutex.Lock()
		if len(cache) >= 256 {
			for cacheKey, entry := range cache {
				if time.Now().After(entry.expires) {
					delete(cache, cacheKey)
				}
			}
			if len(cache) >= 256 {
				for cacheKey := range cache {
					delete(cache, cacheKey)
					break
				}
			}
		}
		cache[key] = cachedIP{value, time.Now().Add(6 * time.Hour)}
		mutex.Unlock()
		toolJSON(w, value)
	}))
}

var dnsLabel = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,63}$`)

func dnsQuery(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	if !readToolJSON(w, r, &input) {
		return
	}
	name := strings.TrimSuffix(strings.TrimSpace(input.Name), ".")
	kind := strings.ToUpper(input.Type)
	if kind == "PTR" {
		if ip, err := netip.ParseAddr(name); err != nil || ip.Zone() != "" {
			fail(w, 400, "invalid_query", "PTR 查询请输入 IP 地址")
			return
		}
	} else {
		if name == "" || len(name) > 253 {
			fail(w, 400, "invalid_query", "域名长度不合法")
			return
		}
		for _, label := range strings.Split(name, ".") {
			if !dnsLabel.MatchString(label) {
				fail(w, 400, "invalid_query", "请输入 ASCII 域名；国际化域名请使用 Punycode")
				return
			}
		}
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	answers := []map[string]any{}
	var err error
	resolver := net.DefaultResolver
	switch kind {
	case "A", "AAAA":
		network := "ip4"
		if kind == "AAAA" {
			network = "ip6"
		}
		var values []net.IP
		values, err = resolver.LookupIP(ctx, network, name)
		for _, value := range values {
			answers = append(answers, map[string]any{"value": value.String()})
		}
	case "CNAME":
		var value string
		value, err = resolver.LookupCNAME(ctx, name)
		if err == nil && !strings.EqualFold(strings.TrimSuffix(value, "."), name) {
			answers = append(answers, map[string]any{"value": value})
		}
	case "MX":
		var values []*net.MX
		values, err = resolver.LookupMX(ctx, name)
		for _, value := range values {
			answers = append(answers, map[string]any{"value": value.Host, "preference": value.Pref})
		}
	case "NS":
		var values []*net.NS
		values, err = resolver.LookupNS(ctx, name)
		for _, value := range values {
			answers = append(answers, map[string]any{"value": value.Host})
		}
	case "TXT", "PTR":
		var values []string
		if kind == "TXT" {
			values, err = resolver.LookupTXT(ctx, name)
		} else {
			values, err = resolver.LookupAddr(ctx, name)
		}
		for _, value := range values {
			answers = append(answers, map[string]any{"value": value})
		}
	default:
		fail(w, 400, "invalid_type", "支持 A、AAAA、CNAME、MX、NS、TXT、PTR")
		return
	}
	if err != nil {
		fail(w, 422, "dns_failed", "查询未成功：域名不存在、没有该类记录或解析服务超时")
		return
	}
	sort.SliceStable(answers, func(i, j int) bool { return fmt.Sprint(answers[i]["value"]) < fmt.Sprint(answers[j]["value"]) })
	toolJSON(w, map[string]any{"name": name, "type": kind, "answers": answers})
}

var headerName = regexp.MustCompile("^[!#$%&'*+.^_`|~0-9A-Za-z-]+$")

func httpRequest(w http.ResponseWriter, r *http.Request, client *http.Client) {
	var input struct {
		URL     string            `json:"url"`
		Method  string            `json:"method"`
		Headers map[string]string `json:"headers"`
		Body    string            `json:"body"`
	}
	if !readToolJSON(w, r, &input) {
		return
	}
	input.Method = strings.ToUpper(input.Method)
	if input.Method != "GET" && input.Method != "POST" {
		fail(w, 400, "invalid_method", "仅支持 GET 和 POST")
		return
	}
	target, err := url.Parse(strings.TrimSpace(input.URL))
	if err != nil || len(input.URL) > 8192 || target.Hostname() == "" || (target.Scheme != "http" && target.Scheme != "https") || target.User != nil {
		fail(w, 400, "invalid_url", "请输入无内嵌凭据的 http:// 或 https:// URL")
		return
	}
	if input.Method == "GET" && input.Body != "" || len(input.Body) > 256<<10 || len(input.Headers) > 50 {
		fail(w, 400, "invalid_input", "GET 不接受请求体；POST 请求体最多 256 KiB，请求头最多 50 项")
		return
	}
	request, err := http.NewRequestWithContext(r.Context(), input.Method, target.String(), strings.NewReader(input.Body))
	if err != nil {
		fail(w, 400, "invalid_url", "请求 URL 不合法")
		return
	}
	for name, value := range input.Headers {
		key := strings.ToLower(name)
		blocked := map[string]bool{"host": true, "connection": true, "proxy-authorization": true, "proxy-connection": true, "upgrade": true, "te": true, "trailer": true, "transfer-encoding": true, "content-length": true, "forwarded": true, "x-forwarded-for": true, "x-forwarded-host": true, "x-real-ip": true}
		if !headerName.MatchString(name) || strings.ContainsAny(value, "\r\n\x00") || len(name)+len(value) > 8192 || blocked[key] || strings.HasPrefix(key, "proxy-") {
			fail(w, 400, "invalid_header", "请求头无效，或包含不允许覆盖的传输/代理头")
			return
		}
		request.Header.Set(name, value)
	}
	if request.Header.Get("User-Agent") == "" {
		request.Header.Set("User-Agent", "Toolbox-HTTP-Client/0.2")
	}
	started := time.Now()
	response, err := client.Do(request)
	if err != nil {
		fail(w, 502, "request_failed", "请求失败：目标必须解析为公网地址，且在 12 秒内响应；请检查域名、端口、证书和网络")
		return
	}
	defer response.Body.Close()
	const maxBody = 1 << 20
	body, err := io.ReadAll(io.LimitReader(response.Body, maxBody+1))
	if err != nil {
		fail(w, 502, "response_failed", "读取响应失败或超时")
		return
	}
	truncated := len(body) > maxBody
	if truncated {
		body = body[:maxBody]
	}
	encoding := "utf-8"
	text := string(body)
	if !utf8.Valid(body) {
		encoding = "base64"
		text = base64.StdEncoding.EncodeToString(body)
	}
	toolJSON(w, map[string]any{"status": response.StatusCode, "statusText": response.Status, "headers": response.Header, "body": text, "encoding": encoding, "truncated": truncated, "durationMs": time.Since(started).Milliseconds(), "url": target.String()})
}
