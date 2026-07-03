const fs = require('fs');
let p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
Object.assign(p.scripts, {
  'test': 'vitest run',
  'test:watch': 'vitest',
  'test:coverage': 'vitest run --coverage',
  'test:p1': 'vitest run tests/phase1',
  'test:p2': 'vitest run tests/phase2',
  'test:p3': 'vitest run tests/phase3',
  'test:p4': 'vitest run tests/phase4',
  'test:p5': 'vitest run tests/phase5',
  'test:p6': 'vitest run tests/phase6',
  'test:p7': 'vitest run tests/phase7',
  'test:p8': 'vitest run tests/phase8',
  'test:p9': 'vitest run tests/phase9',
  'test:e2e': 'playwright test',
  'test:all': 'vitest run tests/ && playwright test',
  'dev:api': 'vercel dev',
  'dev:ws': 'partykit dev'
});
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
