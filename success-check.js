const fs = require('fs');

try {
  console.log('🔍 Looking for report files...');
  
  // List available files
  const files = fs.readdirSync('./zodashield-performance-reports/');
  console.log('Available files:', files);
  
  // Try to find the latest JSON file
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  console.log('JSON files:', jsonFiles);
  
  if (jsonFiles.length < 2) {
    console.log('❌ Need at least 2 JSON files to compare');
    return;
  }
  
  // Use before-optimization.json and the most recent one
  const before = JSON.parse(fs.readFileSync('./zodashield-performance-reports/before-optimization.json', 'utf8'));
  
  // Find the latest file (not before-optimization)
  const otherFiles = jsonFiles.filter(f => f !== 'before-optimization.json');
  const latestFile = otherFiles[otherFiles.length - 1]; // Get the last one
  
  console.log(`Comparing: before-optimization.json vs ${latestFile}`);
  
  const after = JSON.parse(fs.readFileSync(`./zodashield-performance-reports/${latestFile}`, 'utf8'));

  console.log('\n🎯 ZodaShield Performance Optimization Results:');
  console.log('===============================================');

  // Performance Score comparison
  const beforeScore = Math.round(before.categories.performance.score * 100);
  const afterScore = Math.round(after.categories.performance.score * 100);
  const scoreChange = afterScore - beforeScore;
  
  console.log(`⭐ Performance Score: ${beforeScore} → ${afterScore} (${scoreChange >= 0 ? '+' : ''}${scoreChange})`);
  
  if (scoreChange > 0) {
    console.log('\n📊 SUCCESS ANALYSIS:');
    console.log('✅ Achieved significant performance improvement!');
    console.log(`✅ Performance score improved by ${scoreChange} points`);
    if (afterScore >= 90) {
      console.log('✅ Achieved "Good" performance rating!');
    }
  } else {
    console.log('\n⚠️ Performance score decreased or unchanged');
  }

  // Individual metrics
  const metrics = {
    'largest-contentful-paint': 'LCP',
    'first-contentful-paint': 'FCP',
    'cumulative-layout-shift': 'CLS',
    'total-blocking-time': 'TBT'
  };

  console.log('\n📈 Individual Metrics:');
  Object.entries(metrics).forEach(([key, name]) => {
    const beforeValue = before.audits[key]?.numericValue;
    const afterValue = after.audits[key]?.numericValue;

    if (beforeValue !== undefined && afterValue !== undefined) {
      const improvement = ((beforeValue - afterValue) / beforeValue) * 100;
      const emoji = improvement > 0 ? '🟢' : '🔴';

      if (name === 'CLS') {
        console.log(`${emoji} ${name}: ${beforeValue.toFixed(3)} → ${afterValue.toFixed(3)} (${improvement.toFixed(1)}%)`);
      } else {
        console.log(`${emoji} ${name}: ${Math.round(beforeValue)}ms → ${Math.round(afterValue)}ms (${improvement.toFixed(1)}%)`);
      }
    }
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Available files in zodashield-performance-reports/:');
  try {
    const files = fs.readdirSync('./zodashield-performance-reports/');
    files.forEach(file => console.log(`  - ${file}`));
  } catch (e) {
    console.log('  Directory not found');
  }
}
