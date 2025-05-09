package tool

import "testing"

func TestPercent(t *testing.T) {
	type args struct {
		val        float64
		minVal     float64
		maxVal     float64
		minPercent float64
		maxPercent float64
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "case 1",
			args: args{
				val:        0.5,
				minVal:     0,
				maxVal:     1,
				minPercent: 0,
				maxPercent: 1,
			},
			want: "50%",
		},
		{
			name: "case 2",
			args: args{
				val:        0.3,
				minVal:     0.1,
				maxVal:     0.6,
				minPercent: 0,
				maxPercent: 1,
			},
			want: "40%",
		},
		{
			name: "case 3",
			args: args{
				val:        700,
				minVal:     700,
				maxVal:     766,
				minPercent: 0.1,
				maxPercent: 0.7,
			},
			want: "10%",
		},
		{
			name: "case 4",
			args: args{
				val:        766,
				minVal:     700,
				maxVal:     766,
				minPercent: 0.1,
				maxPercent: 0.7,
			},
			want: "70%",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Percent(tt.args.val, tt.args.minVal, tt.args.maxVal, tt.args.minPercent, tt.args.maxPercent); got != tt.want {
				t.Errorf("Percent() = %v, want %v", got, tt.want)
			}
		})
	}
}
