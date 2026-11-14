package safehttp

import (
	"net/netip"
	"testing"
)

func TestPublicIP(t *testing.T) {
	for _, address := range []string{"127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "192.0.2.1", "198.18.0.1", "224.0.0.1", "255.255.255.255", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:db8::1", "64:ff9b::7f00:1", "2002:7f00:1::"} {
		if PublicIP(netip.MustParseAddr(address)) {
			t.Errorf("allowed special address %s", address)
		}
	}
	for _, address := range []string{"8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "2001:4860:4860::8888"} {
		if !PublicIP(netip.MustParseAddr(address)) {
			t.Errorf("blocked public address %s", address)
		}
	}
}
