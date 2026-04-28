import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeTaskMaturity,
  analyzeTodayLoad,
  getAgingLevel,
  summarizeProjectPressure,
  suggestMergeGroups,
} from "../src/lib/focus-flow-model.ts";

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

const item = (overrides) => ({ id: overrides.id || crypto.randomUUID(), content: "输出方案清单", ...base, ...overrides });

test("task maturity flags vague tasks without clear action or output", () => {
  const result = analyzeTaskMaturity(item({ content: "后台看看" }));

  assert.equal(result.level, "weak");
  assert.equal(result.score < 60, true);
  assert.ok(result.reasons.some((reason) => reason.includes("模糊")));
});

test("task maturity treats action plus output as mature", () => {
  const result = analyzeTaskMaturity(item({ content: "梳理后台权限范围", output: "权限归属清单" }));

  assert.equal(result.level, "strong");
  assert.equal(result.score >= 80, true);
});

test("today load sums estimate minutes and detects overload", () => {
  const result = analyzeTodayLoad([
    item({ id: "a", status: "today", estimateMinutes: 180 }),
    item({ id: "b", status: "today", estimateMinutes: 240 }),
    item({ id: "c", status: "batch", estimateMinutes: 999 }),
  ]);

  assert.equal(result.totalMinutes, 420);
  assert.equal(result.level, "overloaded");
  assert.ok(result.message.includes("7小时"));
});

test("aging level uses status-specific thresholds", () => {
  const now = new Date("2026-04-28T00:00:00.000Z");

  assert.equal(getAgingLevel(item({ status: "inbox", updatedAt: "2026-04-24T00:00:00.000Z" }), now)?.level, "warning");
  assert.equal(getAgingLevel(item({ status: "review", updatedAt: "2026-04-20T00:00:00.000Z" }), now)?.level, "danger");
  assert.equal(getAgingLevel(item({ status: "batch", updatedAt: "2026-04-20T00:00:00.000Z" }), now), undefined);
});

test("project pressure weighs active, today, blocked, and aging tasks", () => {
  const now = new Date("2026-04-28T00:00:00.000Z");
  const summaries = summarizeProjectPressure([
    item({ id: "a", projectId: "p1", status: "today", estimateMinutes: 120, updatedAt: "2026-04-28T00:00:00.000Z" }),
    item({ id: "b", projectId: "p1", status: "review", blockedBy: "等客户确认", updatedAt: "2026-04-20T00:00:00.000Z" }),
    item({ id: "c", projectId: "p2", status: "done" }),
  ], [
    { id: "p1", name: "项目一", color: "#fff" },
    { id: "p2", name: "项目二", color: "#000" },
  ], now);

  assert.equal(summaries[0].project.id, "p1");
  assert.equal(summaries[0].blockedCount, 1);
  assert.equal(summaries[0].agingCount, 1);
  assert.equal(summaries[0].pressureLevel, "high");
});

test("merge suggestions group similar open tasks in the same project", () => {
  const groups = suggestMergeGroups([
    item({ id: "a", content: "后台管理-重点企业维护", status: "inbox" }),
    item({ id: "b", content: "后台管理-企业位置选择功能", status: "review" }),
    item({ id: "c", content: "产业链后台维护放到超级管理员", status: "batch" }),
    item({ id: "d", content: "写日报", projectId: "p2", status: "today" }),
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].items.map((x) => x.id).sort(), ["a", "b", "c"]);
});
