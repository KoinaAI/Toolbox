package imaging

import (
	"bytes"
	"context"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"os/exec"
	"strings"
	"testing"
)

func TestImageSignatures(t *testing.T) {
	if _, err := imageType([]byte("<svg xmlns='http://www.w3.org/2000/svg'/>")); err == nil {
		t.Fatal("accepted SVG")
	}
	if kind, err := imageType([]byte{137, 80, 78, 71, 13, 10, 26, 10}); err != nil || kind != "png" {
		t.Fatal("PNG signature rejected")
	}
}

func TestFFmpegTransforms(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("requires FFmpeg; container release validation exercises installed codecs")
	}
	if _, err := exec.LookPath("ffprobe"); err != nil {
		t.Skip("requires ffprobe")
	}
	encoders, err := exec.Command("ffmpeg", "-hide_banner", "-encoders").Output()
	if err != nil {
		t.Fatal(err)
	}
	input := image.NewNRGBA(image.Rect(0, 0, 20, 10))
	input.SetNRGBA(10, 5, color.NRGBA{R: 255, A: 255})
	var data bytes.Buffer
	if err := png.Encode(&data, input); err != nil {
		t.Fatal(err)
	}
	for _, format := range []string{"png", "jpeg", "webp", "avif"} {
		t.Run(format, func(t *testing.T) {
			codec := map[string]string{"webp": "libwebp", "avif": "libaom-av1"}[format]
			if codec != "" && !strings.Contains(string(encoders), codec) {
				t.Skipf("local FFmpeg lacks %s; release container must validate this codec", codec)
			}
			result, err := Process(context.Background(), bytes.NewReader(data.Bytes()), Options{Operation: "resize", Format: format, Quality: 80, Width: 8, Height: 4, KeepAspect: true})
			if err != nil {
				t.Fatal(err)
			}
			if result.Width != 8 || result.Height != 4 || len(result.Data) == 0 {
				t.Fatalf("invalid output dimensions %+v", result)
			}
			if format == "jpeg" {
				decoded, err := jpeg.Decode(bytes.NewReader(result.Data))
				if err != nil {
					t.Fatal(err)
				}
				r, g, b, _ := decoded.At(0, 0).RGBA()
				if r < 60000 || g < 60000 || b < 60000 {
					t.Fatalf("transparency was not flattened onto white: %d,%d,%d", r, g, b)
				}
			}
		})
	}
}
