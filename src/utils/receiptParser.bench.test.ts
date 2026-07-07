import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseReceipt } from "./receiptParser";
import { benchmarkCases } from "./receiptParser.bench.dataset";

const TOLERANCE = 0.01;

// Regression floor: if accuracy drops below this, something in parseReceipt
// broke. Raise this number once you've deliberately improved the parser.
const MIN_ACCEPTABLE_ACCURACY = 70;

describe("Receipt Parser Benchmark", () => {
  it("reports total-extraction accuracy across a realistic multi-format dataset", () => {
    const results = benchmarkCases.map((testCase) => {
      const { total } = parseReceipt(testCase.rawText);
      const pass =
        testCase.expectedTotal === null
          ? total === null
          : total !== null && Math.abs(total - testCase.expectedTotal) < TOLERANCE;
      return { ...testCase, actual: total, pass };
    });

    const passCount = results.filter((r) => r.pass).length;
    const accuracy = (passCount / results.length) * 100;

    const byTag = new Map<string, { pass: number; total: number }>();
    for (const r of results) {
      for (const tag of r.tags) {
        const entry = byTag.get(tag) ?? { pass: 0, total: 0 };
        entry.total += 1;
        if (r.pass) entry.pass += 1;
        byTag.set(tag, entry);
      }
    }

    const lines: string[] = [];
    lines.push("# Receipt Parser Benchmark Results");
    lines.push("");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push("");
    lines.push(`**Overall accuracy: ${accuracy.toFixed(1)}% (${passCount}/${results.length} cases)**`);
    lines.push("");
    lines.push("## Accuracy by category");
    lines.push("");
    lines.push("| Category | Pass | Total | Accuracy |");
    lines.push("|---|---|---|---|");
    for (const [tag, { pass, total }] of [...byTag.entries()].sort()) {
      lines.push(`| ${tag} | ${pass} | ${total} | ${((pass / total) * 100).toFixed(0)}% |`);
    }
    lines.push("");
    lines.push("## Case-by-case results");
    lines.push("");
    lines.push("| # | Label | Expected | Actual | Pass |");
    lines.push("|---|---|---|---|---|");
    results.forEach((r, i) => {
      lines.push(
        `| ${i + 1} | ${r.label} | ${r.expectedTotal ?? "null"} | ${r.actual ?? "null"} | ${r.pass ? "PASS" : "FAIL"} |`,
      );
    });

    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      lines.push("");
      lines.push("## Failures / known limitations");
      lines.push("");
      for (const f of failures) {
        lines.push(`- **${f.label}** — expected ${f.expectedTotal}, got ${f.actual}. ${f.notes}`);
      }
    }

    const report = lines.join("\n");

    const outDir = path.join(process.cwd(), "benchmarks", "receipt-parser");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "results.md"), report);
    fs.writeFileSync(
      path.join(outDir, "results.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          accuracy,
          passCount,
          totalCases: results.length,
          byTag: Object.fromEntries(byTag),
          results: results.map((r) => ({
            label: r.label,
            tags: r.tags,
            expectedTotal: r.expectedTotal,
            actual: r.actual,
            pass: r.pass,
          })),
        },
        null,
        2,
      ),
    );

    console.log("\n" + report + "\n");

    expect(accuracy).toBeGreaterThanOrEqual(MIN_ACCEPTABLE_ACCURACY);
  });
});
