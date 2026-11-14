package catalog

import (
	"encoding/json"
	"testing"
)

func TestCatalogFilteringAndIntegrity(t *testing.T) {
	c, err := Default()
	if err != nil {
		t.Fatal(err)
	}
	if len(c.Tools) != 40 || len(c.Categories) != 8 {
		t.Fatal("unexpected initial directory size")
	}
	if got := c.Filter("development", "JSON 格式"); len(got) != 1 || got[0].ID != "json" {
		t.Fatalf("multi-term match: %+v", got)
	}
	if got := c.Filter("encoding", "base64"); len(got) != 1 {
		t.Fatalf("category filter: %+v", got)
	}
	if got := c.Filter("", "does-not-exist"); len(got) != 0 || got == nil {
		t.Fatal("empty search must serialize as []")
	}
	c.Tools[0].CategoryID = "missing"
	data, _ := json.Marshal(c)
	if _, err := Load(data); err == nil {
		t.Fatal("accepted a dangling category")
	}
}
