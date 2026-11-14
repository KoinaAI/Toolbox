// Package imaging executes bounded, local-only FFmpeg still-image transformations.
package imaging

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const MaxUpload = 12 << 20
const maxPixels = 24_000_000

var ErrUnavailable = errors.New("FFmpeg 或 ffprobe 尚未安装")

// Options selects an output codec and optional bounding-box resize. Zero dimensions are automatic.
type Options struct {
	Operation  string
	Format     string
	Quality    int
	Width      int
	Height     int
	KeepAspect bool
}

// Result contains the encoded image and verified output dimensions.
type Result struct {
	Data         []byte
	MIME         string
	Extension    string
	Width        int
	Height       int
	OriginalSize int
}

type boundedBuffer struct {
	bytes.Buffer
	maximum int
}

func (b *boundedBuffer) Write(p []byte) (int, error) {
	n := len(p)
	if left := b.maximum - b.Len(); left > 0 {
		if len(p) > left {
			p = p[:left]
		}
		_, _ = b.Buffer.Write(p)
	}
	return n, nil
}

func command(ctx context.Context, binary string, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, binary, args...)
	stdout, stderr := &boundedBuffer{maximum: 64 << 10}, &boundedBuffer{maximum: 8 << 10}
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	if err := cmd.Run(); err != nil {
		return nil, err
	}
	return stdout.Bytes(), nil
}

func imageType(data []byte) (string, error) {
	switch {
	case bytes.HasPrefix(data, []byte{137, 80, 78, 71, 13, 10, 26, 10}):
		return "png", nil
	case bytes.HasPrefix(data, []byte{255, 216, 255}):
		return "jpeg", nil
	case bytes.HasPrefix(data, []byte("GIF87a")) || bytes.HasPrefix(data, []byte("GIF89a")):
		return "gif", nil
	case len(data) >= 12 && string(data[:4]) == "RIFF" && string(data[8:12]) == "WEBP":
		return "webp", nil
	case bytes.HasPrefix(data, []byte("BM")):
		return "bmp", nil
	case bytes.HasPrefix(data, []byte{'I', 'I', 42, 0}) || bytes.HasPrefix(data, []byte{'M', 'M', 0, 42}):
		return "tiff", nil
	case len(data) >= 16 && string(data[4:8]) == "ftyp" && (string(data[8:12]) == "avif" || string(data[8:12]) == "avis"):
		return "avif", nil
	default:
		return "", fmt.Errorf("支持 JPEG、PNG、WebP、GIF、BMP、TIFF、AVIF，不接受 SVG 或视频")
	}
}

var decodeArguments = []string{"-v", "error", "-protocol_whitelist", "file,pipe", "-format_whitelist", "png_pipe,jpeg_pipe,webp_pipe,gif,bmp_pipe,tiff_pipe,mov,image2"}

func probe(ctx context.Context, binary, path string) (int, int, error) {
	args := append(append([]string{}, decodeArguments...), "-select_streams", "v:0", "-show_entries", "stream=codec_name,codec_type,width,height:stream_side_data=rotation:stream_tags=rotate", "-of", "json", path)
	data, err := command(ctx, binary, args...)
	if err != nil {
		return 0, 0, fmt.Errorf("无法读取图片，格式不支持或文件已损坏")
	}
	var result struct {
		Streams []struct {
			Codec    string            `json:"codec_name"`
			Width    int               `json:"width"`
			Height   int               `json:"height"`
			Tags     map[string]string `json:"tags"`
			SideData []struct {
				Rotation float64 `json:"rotation"`
			} `json:"side_data_list"`
		} `json:"streams"`
	}
	if json.Unmarshal(data, &result) != nil || len(result.Streams) != 1 {
		return 0, 0, fmt.Errorf("未发现有效图片")
	}
	stream := result.Streams[0]
	switch stream.Codec {
	case "png", "mjpeg", "webp", "gif", "bmp", "tiff", "av1":
	default:
		return 0, 0, fmt.Errorf("不支持的图片编码")
	}
	width, height := stream.Width, stream.Height
	rotation, _ := strconv.ParseFloat(stream.Tags["rotate"], 64)
	if len(stream.SideData) > 0 {
		rotation = stream.SideData[0].Rotation
	}
	if int(math.Abs(math.Round(rotation)))%180 == 90 {
		width, height = height, width
	}
	if width < 1 || height < 1 || width > 12000 || height > 12000 || int64(width)*int64(height) > maxPixels {
		return 0, 0, fmt.Errorf("图片最多 2400 万像素，单边最多 12000 像素")
	}
	return width, height, nil
}

// Process accepts only recognized image bytes, strips metadata, and emits the first frame.
// Files are private to one task and are deleted on success, failure and cancellation.
func Process(parent context.Context, reader io.Reader, options Options) (Result, error) {
	var result Result
	ffmpeg, err := exec.LookPath("ffmpeg")
	if err != nil {
		return result, ErrUnavailable
	}
	ffprobe, err := exec.LookPath("ffprobe")
	if err != nil {
		return result, ErrUnavailable
	}
	if options.Operation != "compress" && options.Operation != "convert" && options.Operation != "resize" {
		return result, fmt.Errorf("未知图片操作")
	}
	if options.Quality < 1 || options.Quality > 100 {
		return result, fmt.Errorf("质量必须为 1–100")
	}
	data, err := io.ReadAll(io.LimitReader(reader, MaxUpload+1))
	if err != nil || len(data) > MaxUpload {
		return result, fmt.Errorf("图片最多 12 MiB")
	}
	inputType, err := imageType(data)
	if err != nil {
		return result, err
	}
	format := options.Format
	if format == "auto" || format == "" {
		format = inputType
		if format == "gif" || format == "bmp" || format == "tiff" {
			format = "png"
		}
	}
	if format == "jpg" {
		format = "jpeg"
	}
	switch format {
	case "jpeg", "png", "webp", "avif":
	default:
		return result, fmt.Errorf("输出支持 JPEG、PNG、WebP、AVIF")
	}
	directory, err := os.MkdirTemp("", "toolbox-image-")
	if err != nil {
		return result, fmt.Errorf("临时存储不可用")
	}
	defer os.RemoveAll(directory)
	inputPath := filepath.Join(directory, "input."+inputType)
	outputPath := filepath.Join(directory, "output."+format)
	if err := os.WriteFile(inputPath, data, 0600); err != nil {
		return result, fmt.Errorf("临时存储写入失败")
	}
	ctx, cancel := context.WithTimeout(parent, 25*time.Second)
	defer cancel()
	width, height, err := probe(ctx, ffprobe, inputPath)
	if err != nil {
		return result, err
	}
	filters := []string{}
	if options.Operation == "resize" {
		w, h := options.Width, options.Height
		if w < 0 || h < 0 || w > 12000 || h > 12000 || w == 0 && h == 0 {
			return result, fmt.Errorf("请指定至少一个 1–12000 的目标尺寸")
		}
		if w == 0 {
			w = int(math.Round(float64(width) * float64(h) / float64(height)))
		} else if h == 0 {
			h = int(math.Round(float64(height) * float64(w) / float64(width)))
		} else if options.KeepAspect {
			ratio := math.Min(float64(w)/float64(width), float64(h)/float64(height))
			w = int(math.Round(float64(width) * ratio))
			h = int(math.Round(float64(height) * ratio))
		}
		if w < 1 || h < 1 || w > 12000 || h > 12000 || int64(w)*int64(h) > maxPixels {
			return result, fmt.Errorf("目标图片最多 2400 万像素，单边最多 12000 像素")
		}
		width, height = w, h
		filters = append(filters, fmt.Sprintf("scale=%d:%d:flags=lanczos", w, h))
	}
	if format == "avif" && width*height > 8_000_000 {
		return result, fmt.Errorf("AVIF 编码最多 800 万像素，请先缩小图片或选择其他格式")
	}
	args := []string{"-nostdin", "-hide_banner", "-loglevel", "error", "-max_alloc", "268435456", "-threads", "2"}
	args = append(args, decodeArguments[2:]...)
	args = append(args, "-i", inputPath, "-map", "0:v:0", "-frames:v", "1", "-map_metadata", "-1", "-filter_threads", "1", "-threads", "2")
	if format == "jpeg" {
		filters = append(filters, "format=rgba,split[fg][bg];[bg]lut=a=255,drawbox=c=white:t=fill[white];[white][fg]overlay=shortest=1:format=auto,format=rgb24")
	}
	if len(filters) > 0 {
		args = append(args, "-vf", strings.Join(filters, ","))
	}
	switch format {
	case "jpeg":
		args = append(args, "-c:v", "mjpeg", "-q:v", strconv.Itoa(2+(100-options.Quality)*29/99), "-pix_fmt", "yuvj444p")
	case "png":
		args = append(args, "-c:v", "png", "-compression_level", "9")
	case "webp":
		args = append(args, "-c:v", "libwebp", "-quality", strconv.Itoa(options.Quality), "-compression_level", "6")
	case "avif":
		args = append(args, "-c:v", "libaom-av1", "-crf", strconv.Itoa((100-options.Quality)*63/99), "-cpu-used", "6", "-still-picture", "1", "-row-mt", "1", "-pix_fmt", "yuv420p")
	}
	args = append(args, "-fs", strconv.Itoa(25<<20), "-y", outputPath)
	if _, err := command(ctx, ffmpeg, args...); err != nil {
		if ctx.Err() != nil {
			return result, fmt.Errorf("图片处理已取消或超过 25 秒，请缩小图片后重试")
		}
		return result, fmt.Errorf("FFmpeg 处理失败，图片可能损坏或当前编码不可用")
	}
	file, err := os.Open(outputPath)
	if err != nil {
		return result, fmt.Errorf("未生成结果图片")
	}
	defer file.Close()
	output, err := io.ReadAll(io.LimitReader(file, (25<<20)+1))
	if err != nil || len(output) == 0 || len(output) >= 25<<20 {
		return result, fmt.Errorf("结果为空或超过 25 MiB，请降低尺寸或质量")
	}
	w, h, err := probe(ctx, ffprobe, outputPath)
	if err != nil {
		return result, fmt.Errorf("输出图片验证失败")
	}
	return Result{Data: output, MIME: "image/" + format, Extension: format, Width: w, Height: h, OriginalSize: len(data)}, nil
}
