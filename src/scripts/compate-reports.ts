// scripts/compare-performance.ts
import * as fs from "fs";
import * as path from "path";

interface LighthouseAudit {
  numericValue?: number;
  score?: number;
}

interface LighthouseReport {
  audits: {
    [key: string]: LighthouseAudit;
  };
  categories: {
    performance: {
      score: number;
    };
  };
}

function compareReports() {
  const reportsDir = path.join(process.cwd(), "zodashield-performance-reports");

  try {
    const beforePath = path.join(reportsDir, "before-homepage.json");
    const afterPath = path.join(reportsDir, "after-homepage.json");

    const before: LighthouseReport = JSON.parse(
      fs.readFileSync(beforePath, "utf8")
    );
    const after: LighthouseReport = JSON.parse(
      fs.readFileSync(afterPath, "utf8")
    );

    const metrics: Record<string, string> = {
      "largest-contentful-paint": "LCP (ms)",
      "interaction-to-next-paint": "INP (ms)",
      "first-contentful-paint": "FCP (ms)",
      "cumulative-layout-shift": "CLS",
      "total-blocking-time": "TBT (ms)",
      "server-response-time": "TTFB (ms)",
    };

    console.log("\n🎯 ZodaShield Performance Optimization Results\n");
    console.log("=".repeat(50));

    Object.entries(metrics).forEach(([key, name]) => {
      const beforeValue = before.audits[key]?.numericValue;
      const afterValue = after.audits[key]?.numericValue;

      if (beforeValue !== undefined && afterValue !== undefined) {
        const improvement = ((beforeValue - afterValue) / beforeValue) * 100;
        const emoji = improvement > 0 ? "🟢" : "🔴";

        if (name.includes("CLS")) {
          console.log(`\n${emoji} ${name}:`);
          console.log(`   Before: ${beforeValue.toFixed(3)}`);
          console.log(`   After:  ${afterValue.toFixed(3)}`);
          console.log(`   Improvement: ${improvement.toFixed(1)}%`);
        } else {
          console.log(`\n${emoji} ${name}:`);
          console.log(`   Before: ${Math.round(beforeValue)}`);
          console.log(`   After:  ${Math.round(afterValue)}`);
          console.log(`   Improvement: ${improvement.toFixed(1)}%`);
        }
      }
    });

    // Performance Score
    const beforeScore = before.categories.performance.score * 100;
    const afterScore = after.categories.performance.score * 100;
    const scoreImprovement = afterScore - beforeScore;

    console.log(`\n⭐ Performance Score:`);
    console.log(`   Before: ${beforeScore.toFixed(1)}/100`);
    console.log(`   After:  ${afterScore.toFixed(1)}/100`);
    console.log(
      `   Improvement: ${scoreImprovement >= 0 ? "+" : ""}${scoreImprovement.toFixed(1)} points`
    );
    console.log("\n" + "=".repeat(50));

    // Additional detailed breakdown
    console.log("\n📊 Detailed Analysis:");
    console.log("=".repeat(50));

    // Check if metrics meet Core Web Vitals thresholds
    const lcpAfter = after.audits["largest-contentful-paint"]?.numericValue;
    const inpAfter = after.audits["interaction-to-next-paint"]?.numericValue;
    const clsAfter = after.audits["cumulative-layout-shift"]?.numericValue;

    if (lcpAfter) {
      const lcpStatus =
        lcpAfter <= 2500
          ? "✅ Good"
          : lcpAfter <= 4000
            ? "⚠️ Needs Improvement"
            : "❌ Poor";
      console.log(`LCP Status: ${lcpStatus} (target: ≤2500ms)`);
    }

    if (inpAfter) {
      const inpStatus =
        inpAfter <= 200
          ? "✅ Good"
          : inpAfter <= 500
            ? "⚠️ Needs Improvement"
            : "❌ Poor";
      console.log(`INP Status: ${inpStatus} (target: ≤200ms)`);
    }

    if (clsAfter) {
      const clsStatus =
        clsAfter <= 0.1
          ? "✅ Good"
          : clsAfter <= 0.25
            ? "⚠️ Needs Improvement"
            : "❌ Poor";
      console.log(`CLS Status: ${clsStatus} (target: ≤0.1)`);
    }
  } catch (error) {
    console.error("❌ Error reading report files:", error);
    console.log(
      "\n💡 Make sure you have run the lighthouse tests and the files exist in the zodashield-performance-reports directory"
    );
  }
}

compareReports();
