package tool

import (
	"crypto/rand"
	"math/big"
)

var (
	letters   = []byte("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
	letterNum = []byte("0123456789")
	letterLow = []byte("abcdefghijklmnopqrstuvwxyz")
	letterCap = []byte("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
	letterSyb = []byte("!@#$%^&*()_+-=")
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
