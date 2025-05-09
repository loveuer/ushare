package tool

import (
	"fmt"
	"math"
)

func Min[T ~int | ~uint | ~int8 | ~uint8 | ~int16 | ~uint16 | ~int32 | ~uint32 | ~int64 | ~uint64 | ~float32 | ~float64](a, b T) T {
	if a <= b {
		return a
	}

	return b
}

func Mins[T ~int | ~uint | ~int8 | ~uint8 | ~int16 | ~uint16 | ~int32 | ~uint32 | ~int64 | ~uint64 | ~float32 | ~float64](vals ...T) T {
	var val T

	if len(vals) == 0 {
		return val
	}

	val = vals[0]

	for _, item := range vals[1:] {
		if item < val {
			val = item
		}
	}

	return val
}

func Max[T ~int | ~uint | ~int8 | ~uint8 | ~int16 | ~uint16 | ~int32 | ~uint32 | ~int64 | ~uint64 | ~float32 | ~float64](a, b T) T {
	if a >= b {
		return a
	}

	return b
}

func Maxs[T ~int | ~uint | ~int8 | ~uint8 | ~int16 | ~uint16 | ~int32 | ~uint32 | ~int64 | ~uint64 | ~float32 | ~float64](vals ...T) T {
	var val T

	if len(vals) == 0 {
		return val
	}

	for _, item := range vals {
		if item > val {
			val = item
		}
	}

	return val
}

func Sum[T ~int | ~uint | ~int8 | ~uint8 | ~int16 | ~uint16 | ~int32 | ~uint32 | ~int64 | ~uint64 | ~float32 | ~float64](vals ...T) T {
	var sum T = 0
	for i := range vals {
		sum += vals[i]
	}
	return sum
}

func Percent(val, minVal, maxVal, minPercent, maxPercent float64) string {
	return fmt.Sprintf(
		"%d%%",
		int(math.Round(
			((val-minVal)/(maxVal-minVal)*(maxPercent-minPercent)+minPercent)*100,
		)),
	)
}
