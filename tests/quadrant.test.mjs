import assert from "node:assert/strict";
import test from "node:test";
import { getEffectiveQuadrant, addDaysToDate } from "../src/lib/focus-flow-model.ts";

const base = {
  source: "manual",
  type: "task",
  status: "inbox",
  priority: "medium",
  projectId: "p1",
  repeatType: "none",
  createdAt: "2026-04-20T00:00:00.000Z",
  updatedAt: "2026-04-20T00:00:00.000Z",
};

const item = (overrides) => ({ id: overrides.id || crypto.randomUUID(), content: "任务", ...base, ...overrides });

test("显式 important/urgent 优先于派生", () => {
  const q = getEffectiveQuadrant(item({ important: true, urgent: true, priority: "low" }));
  assert.equal(q.key, "iu");
  assert.equal(q.importantExplicit, true);
  assert.equal(q.urgentExplicit, true);
});

test("显式设为不重要不紧急也算已固定", () => {
  const q = getEffectiveQuadrant(item({ important: false, urgent: false, priority: "high" }));
  assert.equal(q.key, "nn");
  assert.equal(q.importantExplicit, true);
});

test("高优先级派生为重要", () => {
  const q = getEffectiveQuadrant(item({ priority: "high" }));
  assert.equal(q.important, true);
  assert.equal(q.importantExplicit, false);
});

test("主线派生为重要", () => {
  const q = getEffectiveQuadrant(item({ priority: "low", isMainline: true }));
  assert.equal(q.important, true);
});

test("普通中等优先级且无截止日期落入不重要不紧急", () => {
  const q = getEffectiveQuadrant(item({ priority: "medium" }));
  assert.equal(q.key, "nn");
});

test("近期截止日期派生为紧急", () => {
  const soon = addDaysToDate(undefined, 1); // 明天
  const q = getEffectiveQuadrant(item({ priority: "medium", dueDate: soon }));
  assert.equal(q.urgent, true);
  assert.equal(q.key, "nu");
});

test("逾期任务派生为紧急", () => {
  const past = addDaysToDate(undefined, -3);
  const q = getEffectiveQuadrant(item({ priority: "high", dueDate: past }));
  assert.equal(q.urgent, true);
  assert.equal(q.important, true);
  assert.equal(q.key, "iu");
});

test("远期截止日期不算紧急", () => {
  const far = addDaysToDate(undefined, 10);
  const q = getEffectiveQuadrant(item({ priority: "medium", dueDate: far }));
  assert.equal(q.urgent, false);
});
