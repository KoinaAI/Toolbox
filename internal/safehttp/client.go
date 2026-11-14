// Package safehttp provides an outbound client restricted to public internet addresses.
package safehttp

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/netip"
	"time"
)

var reserved = func() []netip.Prefix {
	var result []netip.Prefix
	// IANA special-purpose registries plus deprecated IPv6 site-local space.
	for _, prefix := range []string{"0.0.0.0/8", "100.64.0.0/10", "192.0.0.0/24", "192.0.2.0/24", "192.88.99.0/24", "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "240.0.0.0/4", "::/96", "64:ff9b::/96", "64:ff9b:1::/48", "100::/64", "100:0:0:1::/64", "2001::/23", "2001:db8::/32", "2002::/16", "3fff::/20", "5f00::/16", "fec0::/10"} {
		result = append(result, netip.MustParsePrefix(prefix))
	}
	return result
}()

// PublicIP excludes local, private, translation, documentation and special-use ranges.
func PublicIP(ip netip.Addr) bool {
	ip = ip.Unmap()
	if !ip.IsValid() || !ip.IsGlobalUnicast() || ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() {
		return false
	}
	for _, prefix := range reserved {
		if prefix.Contains(ip) {
			return false
		}
	}
	return true
}

// NewClient resolves and pins every connection to validated addresses. Environment proxies
// are intentionally disabled; otherwise a proxy could resolve an unvalidated private target.
// Redirects are returned to the caller without being followed.
func NewClient(timeout time.Duration) *http.Client {
	transport := &http.Transport{ForceAttemptHTTP2: true, DisableKeepAlives: true, TLSHandshakeTimeout: 5 * time.Second, ResponseHeaderTimeout: 10 * time.Second, MaxResponseHeaderBytes: 64 << 10}
	transport.DialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(address)
		if err != nil {
			return nil, fmt.Errorf("目标地址格式错误")
		}
		addresses, err := net.DefaultResolver.LookupNetIP(ctx, "ip", host)
		if err != nil || len(addresses) == 0 {
			return nil, fmt.Errorf("目标域名解析失败")
		}
		for _, ip := range addresses {
			if !PublicIP(ip) {
				return nil, fmt.Errorf("仅允许访问公网地址")
			}
		}
		var last error
		for _, ip := range addresses {
			connection, err := (&net.Dialer{Timeout: 5 * time.Second}).DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
			if err == nil {
				return connection, nil
			}
			last = err
		}
		return nil, last
	}
	return &http.Client{Timeout: timeout, Transport: transport, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
}
