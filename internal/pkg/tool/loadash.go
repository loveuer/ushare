package tool

import "math"

func Map[T, R any](vals []T, fn func(item T, index int) R) []R {
	var result = make([]R, len(vals))
	for idx, v := range vals {
		result[idx] = fn(v, idx)
	}
	return result
}

func Chunk[T any](vals []T, size int) [][]T {
	if size <= 0 {
		panic("Second parameter must be greater than 0")
	}

	chunksNum := len(vals) / size
	if len(vals)%size != 0 {
		chunksNum += 1
	}

	result := make([][]T, 0, chunksNum)

	for i := 0; i < chunksNum; i++ {
		last := (i + 1) * size
		if last > len(vals) {
			last = len(vals)
		}
		result = append(result, vals[i*size:last:last])
	}

	return result
}

// 对 vals 取样 x 个
func Sample[T any](vals []T, x int) []T {
	if x < 0 {
		panic("Second parameter can't be negative")
	}

	n := len(vals)
	if n == 0 {
		return []T{}
	}

	if x >= n {
		return vals
	}

	// 处理x=1的特殊情况
	if x == 1 {
		return []T{vals[(n-1)/2]}
	}

	// 计算采样步长并生成结果数组
	step := float64(n-1) / float64(x-1)
	result := make([]T, x)

	for i := 0; i < x; i++ {
		// 计算采样位置并四舍五入
		pos := float64(i) * step
		index := int(math.Round(pos))
		result[i] = vals[index]
	}

	return result
}
