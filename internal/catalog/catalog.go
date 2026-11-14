// Package catalog owns the validated, implementation-independent tool directory.
package catalog

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strings"
	"time"
)

//go:embed catalog.json
var bundled []byte

// Category groups related tools by a stable identifier.
type Category struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Icon        string `json:"icon"`
	Tone        string `json:"tone"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

// Tool describes a directory entry, independently of its executable module.
type Tool struct {
	ID         string   `json:"id"`
	CategoryID string   `json:"categoryId"`
	Title      string   `json:"title"`
	ShortDesc  string   `json:"shortDesc"`
	Icon       string   `json:"icon"`
	Tags       []string `json:"tags"`
	Status     string   `json:"status"`
	Featured   bool     `json:"featured"`
	AddedAt    string   `json:"addedAt"`
	Order      int      `json:"order"`
}

// Catalog is the public versioned directory snapshot. Treat loaded values as immutable.
type Catalog struct {
	Version    int        `json:"version"`
	Categories []Category `json:"categories"`
	Tools      []Tool     `json:"tools"`
}

var slug = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// Default loads the embedded directory and validates its referential integrity.
func Default() (Catalog, error) { return Load(bundled) }

// Load decodes one catalog, rejecting unknown fields, duplicate IDs and dangling categories.
func Load(data []byte) (Catalog, error) {
	var c Catalog
	dec := json.NewDecoder(bytes.NewReader(data))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&c); err != nil {
		return c, fmt.Errorf("decode catalog: %w", err)
	}
	if err := dec.Decode(new(any)); err != io.EOF {
		return c, fmt.Errorf("catalog must contain one JSON object")
	}
	if c.Version != 1 || len(c.Categories) == 0 {
		return c, fmt.Errorf("unsupported version or empty categories")
	}
	categories := map[string]bool{}
	for _, category := range c.Categories {
		if !slug.MatchString(category.ID) || categories[category.ID] || strings.TrimSpace(category.Title) == "" || category.Icon == "" || category.Tone == "" {
			return c, fmt.Errorf("invalid or duplicate category %q", category.ID)
		}
		categories[category.ID] = true
	}
	tools := map[string]bool{}
	for _, tool := range c.Tools {
		if !slug.MatchString(tool.ID) || tools[tool.ID] || !categories[tool.CategoryID] || strings.TrimSpace(tool.Title) == "" || strings.TrimSpace(tool.ShortDesc) == "" || tool.Icon == "" {
			return c, fmt.Errorf("invalid tool %q or category reference", tool.ID)
		}
		if tool.Status != "planned" && tool.Status != "available" {
			return c, fmt.Errorf("invalid status for %q", tool.ID)
		}
		if _, err := time.Parse(time.DateOnly, tool.AddedAt); err != nil {
			return c, fmt.Errorf("invalid addedAt for %q", tool.ID)
		}
		tools[tool.ID] = true
	}
	return c, nil
}

// Find returns a tool by its stable slug.
func (c Catalog) Find(id string) (Tool, bool) {
	for _, t := range c.Tools {
		if t.ID == id {
			return t, true
		}
	}
	return Tool{}, false
}

// Filter searches title, short description and tags, optionally within a category.
func (c Catalog) Filter(category, query string) []Tool {
	result := make([]Tool, 0)
	terms := strings.Fields(strings.ToLower(query))
	for _, t := range c.Tools {
		if category != "" && t.CategoryID != category {
			continue
		}
		haystack := strings.ToLower(t.Title + " " + t.ShortDesc + " " + strings.Join(t.Tags, " "))
		match := true
		for _, term := range terms {
			if !strings.Contains(haystack, term) {
				match = false
				break
			}
		}
		if match {
			result = append(result, t)
		}
	}
	return result
}
