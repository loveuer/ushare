package tool

import (
	"crypto/rand"
	"math/big"
	mrand "math/rand"
)

var (
	letters    = []byte("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
	letterNum  = []byte("0123456789")
	letterLow  = []byte("abcdefghijklmnopqrstuvwxyz")
	letterCap  = []byte("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
	letterSyb  = []byte("!@#$%^&*()_+-=")
	adjectives = []string{
		"开心的", "灿烂的", "温暖的", "阳光的", "活泼的",
		"聪明的", "优雅的", "幸运的", "甜蜜的", "勇敢的",
		"宁静的", "热情的", "温柔的", "幽默的", "坚强的",
		"迷人的", "神奇的", "快乐的", "健康的", "自由的",
		"梦幻的", "勤劳的", "真诚的", "浪漫的", "自信的",
	}

	plants = []string{
		"苹果", "香蕉", "橘子", "葡萄", "草莓",
		"西瓜", "樱桃", "菠萝", "柠檬", "蜜桃",
		"蓝莓", "芒果", "石榴", "甜瓜", "雪梨",
		"番茄", "南瓜", "土豆", "青椒", "洋葱",
		"黄瓜", "萝卜", "豌豆", "玉米", "蘑菇",
		"菠菜", "茄子", "芹菜", "莲藕", "西兰花",
	}
)

func RandomInt(max int64) int64 {
	num, _ := rand.Int(rand.Reader, big.NewInt(max))
	return num.Int64()
}

func RandomString(length int) string {
	result := make([]byte, length)
	for i := 0; i < length; i++ {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		result[i] = letters[num.Int64()]
	}
	return string(result)
}

func RandomPassword(length int, withSymbol bool) string {
	result := make([]byte, length)
	kind := 3
	if withSymbol {
		kind++
	}

	for i := 0; i < length; i++ {
		switch i % kind {
		case 0:
			num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letterNum))))
			result[i] = letterNum[num.Int64()]
		case 1:
			num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letterLow))))
			result[i] = letterLow[num.Int64()]
		case 2:
			num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letterCap))))
			result[i] = letterCap[num.Int64()]
		case 3:
			num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letterSyb))))
			result[i] = letterSyb[num.Int64()]
		}
	}
	return string(result)
}

func RandomName() string {
	return adjectives[mrand.Intn(len(adjectives))] + plants[mrand.Intn(len(plants))]
}
