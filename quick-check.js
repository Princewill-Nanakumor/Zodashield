const fs = require('fs');

try {
  const before = JSON.parse(fs.readFileSync('./zodashield-performance-reports/before-optimization.json', 'utf8'));
  const after = JSON.parse(fs.readFileSync('./zodashield-performance-reports/after-step1.json', 'utf8'));

  console.log('🎯 Code Splitting Results:');
  console.log('========================');

  const metrics = {
    'largest-contentful-paint': 'LCP',
    'first-contentful-paint': 'FCP',
    'cumulative-layout-shift': 'CLS',
    'total-blocking-time': 'TBT'
  };

  Object.entries(metrics).forEach(([key, name]) => {
    const beforeValue = before.audits[key]?.numericValue;
    const afterValue = after.audits[key]?.numericValue;

    if (beforeValue && afterValue) {
      const improvement = ((beforeValue - afterValue) / beforeValue) * 100;
      const emoji = improvement > 0 ? '🟢' : '🔴';

      if (name === 'CLS') {
        console.log(`${emoji} ${name}: ${beforeValue.toFixed(3)} → ${afterValue.toFixed(3)} (${improvement.toFixed(1)}%)`);
      } else {
        console.log(`${emoji} ${name}: ${Math.round(beforeValue)}ms → ${Math.round(afterValue)}ms (${improvement.toFixed(1)}%)`);
      }
    }
  });

  // Performance Score
  const beforeScore = Math.round(before.categories.performance.score * 100);
  const afterScore = Math.round(after.categories.performance.score * 100);
  const scoreChange = afterScore - beforeScore;
  
  console.log(`⭐ Performance Score: ${beforeScore} → ${afterScore} (${scoreChange >= 0 ? '+' : ''}${scoreChange})`);
  
  console.log('\n📊 Summary:');
  if (scoreChange > 0) {
    console.log('✅ Overall performance improved!');
  } else if (scoreChange === 0) {
    console.log('➡️ Performance score unchanged');
  } else {
    console.log('⚠️ Performance score decreased');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Available files:');
  try {
    const files = fs.readdirSync('./zodashield-performance-reports/');
    files.forEach(file => console.log(`  - ${file}`));
  } catch (e) {
    console.log('  No reports directory found');
  }
}
