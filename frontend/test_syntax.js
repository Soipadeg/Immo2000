const fs = require('fs');
const path = require('path');
const code = fs.readFileSync('./src/pages/NotaireDashboardPage.jsx', 'utf-8');

// Try to parse as if it were JS
try {
  new Function(code);
  console.log('✓ Code is valid JavaScript');
} catch (e) {
  console.log('✗ JavaScript syntax error:');
  console.log(e.message);
  console.log('Line:', e.stack.match(/line (\d+)/)?.[1]);
}
