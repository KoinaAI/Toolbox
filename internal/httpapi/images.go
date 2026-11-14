package httpapi

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/KoinaAI/Toolbox/internal/imaging"
)

func imageRoutes(mux *http.ServeMux) {
	slots := make(chan struct{}, 1)
	for id, operation := range map[string]string{"image-compress": "compress", "image-convert": "convert", "image-resize": "resize"} {
		mux.HandleFunc("POST /api/v1/tools/"+id+"/process", func(w http.ResponseWriter, r *http.Request) {
			select {
			case slots <- struct{}{}:
				defer func() { <-slots }()
			default:
				fail(w, 429, "busy", "已有图片任务正在处理，请稍后重试")
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, imaging.MaxUpload+(128<<10))
			err := r.ParseMultipartForm(1 << 20)
			if r.MultipartForm != nil {
				defer r.MultipartForm.RemoveAll()
			}
			if err != nil {
				fail(w, 400, "invalid_upload", "请上传不超过 12 MiB 的图片")
				return
			}
			files := 0
			for _, entries := range r.MultipartForm.File {
				files += len(entries)
			}
			if files != 1 {
				fail(w, 400, "invalid_upload", "每次只接受一张图片")
				return
			}
			file, _, err := r.FormFile("file")
			if err != nil {
				fail(w, 400, "missing_file", "缺少 file 图片文件")
				return
			}
			defer file.Close()
			integer := func(key string, fallback int) (int, error) {
				value := r.FormValue(key)
				if value == "" {
					return fallback, nil
				}
				return strconv.Atoi(value)
			}
			quality, errQ := integer("quality", 80)
			width, errW := integer("width", 0)
			height, errH := integer("height", 0)
			if errQ != nil || errW != nil || errH != nil {
				fail(w, 400, "invalid_options", "质量和尺寸必须是整数")
				return
			}
			result, err := imaging.Process(r.Context(), file, imaging.Options{Operation: operation, Format: r.FormValue("format"), Quality: quality, Width: width, Height: height, KeepAspect: r.FormValue("keepAspect") != "false"})
			if err != nil {
				status := 422
				if errors.Is(err, imaging.ErrUnavailable) {
					status = 503
				}
				fail(w, status, "image_failed", err.Error())
				return
			}
			w.Header().Set("Content-Type", result.MIME)
			w.Header().Set("Cache-Control", "no-store")
			w.Header().Set("Content-Disposition", `attachment; filename="toolbox-image.`+result.Extension+`"`)
			w.Header().Set("X-Original-Size", strconv.Itoa(result.OriginalSize))
			w.Header().Set("X-Image-Width", strconv.Itoa(result.Width))
			w.Header().Set("X-Image-Height", strconv.Itoa(result.Height))
			w.Header().Set("Content-Length", strconv.Itoa(len(result.Data)))
			_, _ = w.Write(result.Data)
		})
	}
}
