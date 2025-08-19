// scripts/quick-compare.js
import fs from "fs";
import path from "path";

const beforePath = path.join(
  process.cwd(),
  "zodashield-performance-reports",
  "before-optimization.json"
);
const afterPath = path.join(
  process.cwd(),
  "zodashield-performance-reports",
  "after-step1.json"
);

try {
  const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
  const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));

  console.log("🎯 Code Splitting Results:");
  console.log("========================");

  const metrics = {
    "largest-contentful-paint": "LCP",
    "first-contentful-paint": "FCP",
    "cumulative-layout-shift": "CLS",
    "total-blocking-time": "TBT",
  };

  Object.entries(metrics).forEach(([key, name]) => {
    const beforeValue = before.audits[key]?.numericValue;
    const afterValue = after.audits[key]?.numericValue;

    if (beforeValue && afterValue) {
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
  console.log(
    `⭐ Performance Score: ${beforeScore} → ${afterScore} (+${afterScore - beforeScore})`
  );
} catch {
  console.log(
    "💡 Make sure both lighthouse reports exist in zodashield-performance-reports/"
  );
}
