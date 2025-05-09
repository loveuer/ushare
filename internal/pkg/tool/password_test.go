package tool

import "testing"

func TestEncPassword(t *testing.T) {
	password := "123456"

	result := EncryptPassword(password, RandomString(8), 50000)

	t.Logf("sum => %s", result)
}

func TestPassword(t *testing.T) {
	p := "wahaha@123"
	p = NewPassword(p)
	t.Logf("password => %s", p)

	result := ComparePassword("wahaha@123", p)
	t.Logf("compare result => %v", result)
}
