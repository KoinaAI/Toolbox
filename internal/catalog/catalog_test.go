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
	if len(c.Tools) == 0 || len(c.Categories) == 0 {
		t.Fatal("the bundled directory must not be empty")
	}
	// Isolate filter assertions so adding real directory entries never breaks them.
	jsonTool, _ := c.Find("json")
	base64Tool, _ := c.Find("base64")
	c.Tools = []Tool{jsonTool, base64Tool}
	if got := c.Filter("development", "JSON 格式"); len(got) != 1 || got[0].ID != "json" {
		t.Fatalf("multi-term match: %+v", got)
	}
	if got := c.Filter("encoding", "base64"); len(got) != 1 {
		t.Fatalf("category filter: %+v", got)
	}
	if got := c.Filter("", "does-not-exist"); len(got) != 0 || got == nil {
		t.Fatal("empty search must serialize as []")
	}
	orderedData, _ := json.Marshal(c)
	ordered, err := Load(orderedData)
	if err != nil || ordered.Tools[0].ID != "base64" {
		t.Fatal("catalog must honor explicit order independently of JSON array position")
	}
	c.Tools[0].CategoryID = "missing"
	data, _ := json.Marshal(c)
	if _, err := Load(data); err == nil {
		t.Fatal("accepted a dangling category")
	}
}
