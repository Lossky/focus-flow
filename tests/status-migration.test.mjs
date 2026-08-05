import assert from "node:assert/strict";
import test from "node:test";
import { migrateItemStatus, migrateItems } from "../src/lib/focus-flow-model.ts";

const base = {
  source: "manual",
  type: "task",
  priority: "medium",
  projectId: "p1",
  repeatType: "none",
  createdAt: "2026-04-20T00:00:00.000Z",
  updatedAt: "2026-04-20T00:00:00.000Z",
};

const item = (overrides) => ({ id: overrides.id || crypto.randomUUID(), content: "任务", ...base, ...overrides });

test("review 迁移到 inbox", () => {
  const result = migrateItemStatus(item({ status: "review" }));
  assert.equal(result.status, "inbox");
});

test("batch 迁移到 shelved", () => {
  const result = migrateItemStatus(item({ status: "batch" }));
  assert.equal(result.status, "shelved");
});

test("当前有效状态不被改动（返回同一引用）", () => {
  const input = item({ status: "today" });
  const result = migrateItemStatus(input);
  assert.equal(result, input);
});

test("done/archived 不受影响", () => {
  assert.equal(migrateItemStatus(item({ status: "done" })).status, "done");
  assert.equal(migrateItemStatus(item({ status: "archived" })).status, "archived");
});

test("history 里的旧状态一并迁移", () => {
  const result = migrateItemStatus(item({
    status: "done",
    history: [
      { type: "created", to: "review", at: "2026-04-20T00:00:00.000Z" },
      { type: "status_changed", from: "review", to: "batch", at: "2026-04-21T00:00:00.000Z" },
      { type: "completed", from: "batch", to: "done", at: "2026-04-22T00:00:00.000Z" },
    ],
  }));
  assert.equal(result.history[0].to, "inbox");
  assert.equal(result.history[1].from, "inbox");
  assert.equal(result.history[1].to, "shelved");
  assert.equal(result.history[2].from, "shelved");
  assert.equal(result.history[2].to, "done");
});

test("批量迁移保留数量且不丢数据", () => {
  const items = [
    item({ id: "a", status: "review", content: "待审任务" }),
    item({ id: "b", status: "batch", content: "批处理任务" }),
    item({ id: "c", status: "today", content: "今日任务" }),
  ];
  const result = migrateItems(items);
  assert.equal(result.length, 3);
  assert.deepEqual(result.map((i) => i.status), ["inbox", "shelved", "today"]);
  // 内容不能丢
  assert.deepEqual(result.map((i) => i.content), ["待审任务", "批处理任务", "今日任务"]);
});
