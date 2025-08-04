// // quick-fix.js
// const fs = require("fs");
// const path = require("path");

// function fixSyntaxErrors() {
//   const filesToFix = [
//     "src/app/api/users/route.ts",
//     "src/app/api/leads/all/route.ts",
//     "src/app/api/leads/assigned/route.ts",
//     "src/app/api/statuses/route.ts"
//   ];

//   filesToFix.forEach(filePath => {
//     try {
//       if (fs.existsSync(filePath)) {
//         let content = fs.readFileSync(filePath, "utf8");

//         // Fix common syntax issues caused by the script
//         content = content.replace(/^\s*\);\s*$/gm, ''); // Remove standalone )
//         content = content.replace(/^\s*\};\s*$/gm, ''); // Remove standalone }
//         content = content.replace(/^\s*\]\s*$/gm, ''); // Remove standalone ]
//         content = content.replace(/^\s*\)\s*$/gm, ''); // Remove standalone )

//         fs.writeFileSync(filePath, content);
//         console.log(`✅ Fixed syntax in: ${filePath}`);
//       }
//     } catch (error) {
//       console.error(`❌ Error fixing ${filePath}:`, error.message);
//     }
//   });
// }

// fixSyntaxErrors();
// console.log("Quick syntax fix complete!");
