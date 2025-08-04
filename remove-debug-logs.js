import fs from "fs";
import path from "path";

// Function to recursively find all .ts and .tsx files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules" &&
      file !== ".next"
    ) {
      findFiles(filePath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to remove debug console logs
function removeDebugLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Remove console.log statements with debug patterns
    const debugPatterns = [
      /console\.log\([^)]*API DEBUG[^)]*\);?\s*/g,
      /console\.log\([^)]*🔍[^)]*\);?\s*/g,
      /console\.log\([^)]*Found statuses[^)]*\);?\s*/g,
      /console\.log\([^)]*Transformed statuses[^)]*\);?\s*/g,
      /console\.log\([^)]*Session[^)]*\);?\s*/g,
      /console\.log\([^)]*Query[^)]*\);?\s*/g,
      /console\.log\([^)]*User ID[^)]*\);?\s*/g,
      /console\.log\([^)]*User Role[^)]*\);?\s*/g,
      /console\.log\([^)]*Session adminId[^)]*\);?\s*/g,
      /console\.log\([^)]*Computed adminId[^)]*\);?\s*/g,
      /console\.log\([^)]*Raw leads from DB[^)]*\);?\s*/g,
      /console\.log\([^)]*Sample lead[^)]*\);?\s*/g,
      /console\.log\([^)]*Raw API leads data[^)]*\);?\s*/g,
      /console\.log\([^)]*Session expired[^)]*\);?\s*/g,
      /console\.log\([^)]*�� Refreshing session token[^)]*\);?\s*/g,
    ];

    debugPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, "");
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
const projectRoot = process.cwd();
const files = findFiles(projectRoot);

console.log(`Found ${files.length} TypeScript files to process...`);

files.forEach((file) => {
  removeDebugLogs(file);
});

console.log("Debug log removal complete!");
