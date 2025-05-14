package tool

import (
	"net"
)

var (
	privateIPv4Blocks []*net.IPNet
	privateIPv6Blocks []*net.IPNet
)

func init() {
	// IPv4私有地址段
	for _, cidr := range []string{
		"10.0.0.0/8",     // A类私有地址
		"172.16.0.0/12",  // B类私有地址
		"192.168.0.0/16", // C类私有地址
		"169.254.0.0/16", // 链路本地地址
		"127.0.0.0/8",    // 环回地址
	} {
		_, block, _ := net.ParseCIDR(cidr)
		privateIPv4Blocks = append(privateIPv4Blocks, block)
	}

	// IPv6私有地址段
	for _, cidr := range []string{
		"fc00::/7",  // 唯一本地地址
		"fe80::/10", // 链路本地地址
		"::1/128",   // 环回地址
	} {
		_, block, _ := net.ParseCIDR(cidr)
		privateIPv6Blocks = append(privateIPv6Blocks, block)
	}
}

func IsPrivateIP(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}

	// 处理IPv4和IPv4映射的IPv6地址
	if ip4 := ip.To4(); ip4 != nil {
		for _, block := range privateIPv4Blocks {
			if block.Contains(ip4) {
				return true
			}
		}
		return false
	}

	// 处理IPv6地址
	for _, block := range privateIPv6Blocks {
		if block.Contains(ip) {
			return true
		}
	}
	return false
}
