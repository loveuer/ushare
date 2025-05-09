package tool

import "fmt"

func HumanDuration(nano int64) string {
	duration := float64(nano)
	unit := "ns"
	if duration >= 1000 {
		duration /= 1000
		unit = "us"
	}

	if duration >= 1000 {
		duration /= 1000
		unit = "ms"
	}

	if duration >= 1000 {
		duration /= 1000
		unit = " s"
	}

	return fmt.Sprintf("%6.2f%s", duration, unit)
}

func HumanSize(size int64) string {
	const (
		_  = iota
		KB = 1 << (10 * iota) // 1 KB = 1024 bytes
		MB                    // 1 MB = 1024 KB
		GB                    // 1 GB = 1024 MB
		TB                    // 1 TB = 1024 GB
		PB                    // 1 PB = 1024 TB
	)

	switch {
	case size >= PB:
		return fmt.Sprintf("%.2f PB", float64(size)/PB)
	case size >= TB:
		return fmt.Sprintf("%.2f TB", float64(size)/TB)
	case size >= GB:
		return fmt.Sprintf("%.2f GB", float64(size)/GB)
	case size >= MB:
		return fmt.Sprintf("%.2f MB", float64(size)/MB)
	case size >= KB:
		return fmt.Sprintf("%.2f KB", float64(size)/KB)
	default:
		return fmt.Sprintf("%d bytes", size)
	}
}
