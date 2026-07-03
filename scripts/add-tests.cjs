const fs = require('fs');
let p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.scripts = Object.assign(p.scripts || {}, {
  'test:migration:phase1': 'vitest run tests/migration/phase1.test.ts',
  'test:migration:phase2': 'vitest run tests/migration/phase2.test.ts',
  'test:migration:phase3': 'vitest run tests/migration/phase3.test.ts',
  'test:migration:phase4': 'vitest run tests/migration/phase4.test.ts',
  'test:migration:phase5': 'vitest run tests/migration/phase5.test.ts',
  'test:migration:phase6': 'vitest run tests/migration/phase6.test.ts',
  'test:migration:phase7': 'vitest run tests/migration/phase7.test.ts',
  'test:migration:phase8': 'vitest run tests/migration/phase8.test.ts',
  'test:migration:all': 'vitest run tests/migration/ && npm run check'
});
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
