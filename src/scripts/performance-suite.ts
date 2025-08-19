// scripts/performance-suite.ts
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const SITE_URL = "https://zodashield.com/";
const REPORTS_DIR = path.join(process.cwd(), "zodashield-performance-reports");

interface TestConfig {
  name: string;
  output: string;
  flags?: string[];
}

const tests: TestConfig[] = [
  {
    name: "Desktop",
    output: "desktop",
    flags: ["--preset=perf", "--form-factor=desktop"],
  },
  {
    name: "Mobile",
    output: "mobile",
    flags: ["--preset=perf", "--form-factor=mobile"],
  },
  { name: "Standard", output: "standard", flags: [] },
];

class PerformanceTester {
  private ensureReportsDir() {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  }

  private runLighthouse(testConfig: TestConfig, phase: "before" | "after") {
    const outputPath = path.join(
      REPORTS_DIR,
      `${phase}-${testConfig.output}.json`
    );
    const flags = [
      '--chrome-flags="--headless --no-sandbox"',
      "--output=json",
      `--output-path=${outputPath}`,
      ...(testConfig.flags || []),
    ].join(" ");

    const command = `lighthouse ${SITE_URL} ${flags}`;

    console.log(`🔍 Running ${phase} test for ${testConfig.name}...`);
    try {
      execSync(command, { stdio: "inherit" });
      console.log(`✅ ${testConfig.name} ${phase} test completed`);
    } catch (error) {
      console.error(`❌ ${testConfig.name} ${phase} test failed:`, error);
    }
  }

  public runBeforeTests() {
    this.ensureReportsDir();
    console.log("🚀 Running BEFORE optimization tests...\n");

    tests.forEach((test) => {
      this.runLighthouse(test, "before");
    });

    console.log("\n✅ All BEFORE tests completed!");
    console.log(
      "👉 Now implement your optimizations and run: npm run perf:after"
    );
  }

  public runAfterTests() {
    console.log("🚀 Running AFTER optimization tests...\n");

    tests.forEach((test) => {
      this.runLighthouse(test, "after");
    });

    console.log("\n✅ All AFTER tests completed!");
    console.log("👉 Run: npm run perf:compare to see results");
  }

  public compareResults() {
    console.log("\n📊 Generating Performance Comparison Report...\n");

    tests.forEach((test) => {
      const beforePath = path.join(REPORTS_DIR, `before-${test.output}.json`);
      const afterPath = path.join(REPORTS_DIR, `after-${test.output}.json`);

      if (fs.existsSync(beforePath) && fs.existsSync(afterPath)) {
        this.generateComparison(test.name, beforePath, afterPath);
      } else {
        console.log(`⚠️ Missing reports for ${test.name} test`);
      }
    });
  }

  private generateComparison(
    testName: string,
    beforePath: string,
    afterPath: string
  ) {
    try {
      const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
      const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));

      console.log(`\n🎯 ${testName} Results:`);
      console.log("=".repeat(30));

      const metrics = {
        "largest-contentful-paint": "LCP",
        "interaction-to-next-paint": "INP",
        "first-contentful-paint": "FCP",
        "cumulative-layout-shift": "CLS",
        "total-blocking-time": "TBT",
        "server-response-time": "TTFB",
      };

      Object.entries(metrics).forEach(([key, name]) => {
        const beforeValue = before.audits[key]?.numericValue;
        const afterValue = after.audits[key]?.numericValue;

        if (beforeValue !== undefined && afterValue !== undefined) {
          const improvement = ((beforeValue - afterValue) / beforeValue) * 100;
          const emoji = improvement > 0 ? "🟢" : "🔴";

          if (name === "CLS") {
            console.log(
              `${emoji} ${name}: ${beforeValue.toFixed(3)} → ${afterValue.toFixed(3)} (${improvement.toFixed(1)}%)`
            );
          } else {
            console.log(
              `${emoji} ${name}: ${Math.round(beforeValue)}ms → ${Math.round(afterValue)}ms (${improvement.toFixed(1)}%)`
            );
          }
        }
      });

      // Performance Score
      const beforeScore = Math.round(before.categories.performance.score * 100);
      const afterScore = Math.round(after.categories.performance.score * 100);
      const scoreImprovement = afterScore - beforeScore;

      console.log(
        `⭐ Score: ${beforeScore} → ${afterScore} (${scoreImprovement >= 0 ? "+" : ""}${scoreImprovement})`
      );
    } catch (error) {
      console.error(`❌ Error comparing ${testName} results:`, error);
    }
  }
}

// CLI Interface
const tester = new PerformanceTester();
const command = process.argv[2];

switch (command) {
  case "before":
    tester.runBeforeTests();
    break;
  case "after":
    tester.runAfterTests();
    break;
  case "compare":
    tester.compareResults();
    break;
  default:
    console.log(
      "Usage: ts-node scripts/performance-suite.ts [before|after|compare]"
    );
}
