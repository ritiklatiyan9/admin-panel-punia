import assert from "node:assert/strict";
import { test } from "node:test";
import { activitySeries, eventLabel, percentage } from "../src/pages/dashboard/dashboard-utils.ts";

test("daily series fills missing UTC days without changing recorded activity", () => {
  const rows = [{ bucket: "2026-09-25", views: 8, clicks: 3, downloads: 2 }];
  const snapshot = structuredClone(rows);
  const series = activitySeries(rows, "daily", new Date("2026-09-27T08:30:00Z"));
  assert.equal(series[0].bucket, "2026-09-13");
  assert.equal(series.at(-1)?.bucket, "2026-09-27");
  assert.equal(series.length, 15); // Both boundary days can be partial.
  assert.deepEqual(series.find((row) => row.bucket === "2026-09-25"), rows[0]);
  assert.equal(series.reduce((sum, row) => sum + row.views, 0), 8);
  assert.equal(series.find((row) => row.bucket === "2026-09-24")?.views, 0);
  assert.deepEqual(rows, snapshot);
});

test("weekly buckets align to PostgreSQL Monday boundaries across a year", () => {
  const series = activitySeries([], "weekly", new Date("2027-01-03T03:00:00Z"));
  assert.equal(series.at(-1)?.bucket, "2026-12-28");
  assert.ok(series.every((row) => new Date(`${row.bucket}T00:00:00Z`).getUTCDay() === 1));
  for (let i = 1; i < series.length; i++) {
    assert.equal(Date.parse(series[i].bucket) - Date.parse(series[i - 1].bucket), 7 * 86_400_000);
  }
});

test("monthly buckets handle leap years without skipping February or drifting dates", () => {
  const series = activitySeries([], "monthly", new Date("2024-03-31T23:30:00Z"));
  assert.equal(series[0].bucket, "2023-04-01");
  assert.equal(series.at(-1)?.bucket, "2024-03-01");
  assert.ok(series.some((row) => row.bucket === "2024-02-01"));
  assert.ok(series.every((row) => row.bucket.endsWith("-01")));
});

test("UTC chart dates do not shift for India or daylight saving offsets", () => {
  const india = activitySeries([], "daily", new Date("2026-09-27T01:00:00+05:30"));
  assert.equal(india.at(-1)?.bucket, "2026-09-26");
  const daylightSaving = activitySeries([], "daily", new Date("2026-03-09T00:30:00-04:00"));
  assert.equal(daylightSaving.at(-1)?.bucket, "2026-03-09");
  assert.equal(daylightSaving.length, 15);
});

test("zero denominators remain undefined and repeated events are not silently capped", () => {
  assert.equal(percentage(0, 0), "—");
  assert.equal(percentage(3, 0), "—");
  assert.equal(percentage(0, 10), "0.0%");
  assert.equal(percentage(1, 3), "33.3%");
  assert.equal(percentage(12, 10), "120.0%");
});

test("event labels are readable while keeping separate event identities", () => {
  assert.equal(eventLabel("offer.download_click"), "Offer Download Click");
  assert.equal(eventLabel("wallet:credit-success"), "Wallet Credit Success");
});
