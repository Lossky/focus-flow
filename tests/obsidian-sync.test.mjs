import assert from "node:assert/strict";
import test from "node:test";

import { mergeObsidianCaptureItems, parseObsidianCaptureMarkdown } from "../src/lib/obsidian-sync.ts";

const sampleMarkdown = `# 捕获台 · 2026-W22

## 2026-05-29 周五

- [ ] 06:14 跟王泽铭沟通需求细节
  - 备注：
  - 后续：转入 FocusFlow
  - 标签：#FocusFlow

- [ ] 12:48 跟客户确认原型
  - 备注：
  - 后续：
  - 标签：
`;

test("parseObsidianCaptureMarkdown only keeps FocusFlow-marked entries", () => {
  const entries = parseObsidianCaptureMarkdown(sampleMarkdown, { sourcePath: "/vault/捕获台/2026-W22.md" });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].content, "跟王泽铭沟通需求细节");
  assert.equal(entries[0].sourcePath, "/vault/捕获台/2026-W22.md");
  assert.equal(entries[0].focusFlowMarked, true);
});

test("mergeObsidianCaptureItems imports new entries as obsidian inbox items and skips duplicates", () => {
  const entries = parseObsidianCaptureMarkdown(sampleMarkdown, { sourcePath: "/vault/捕获台/2026-W22.md" });
  const existingItems = [
    {
      id: "existing-1",
      content: "跟王泽铭沟通需求细节",
      source: "manual",
      type: "candidate",
      status: "inbox",
      priority: "medium",
      projectId: "default",
      repeatType: "none",
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      rawInput: "跟王泽铭沟通需求细节",
      depth: 0,
    },
  ];

  const result = mergeObsidianCaptureItems(existingItems, entries, { now: new Date("2026-06-02T00:00:00.000Z") });

  assert.equal(result.imported.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.nextItems.length, 1);
});
