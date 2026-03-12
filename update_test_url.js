const fs = require('fs');
let code = fs.readFileSync('synthetic_test.js', 'utf8');
code = code.replace(/console\.error\(e\);/g, 'console.log("Play error:", e.message);');
fs.writeFileSync('synthetic_test.js', code);
console.log("Updated test to log play error");
