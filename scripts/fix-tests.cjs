const fs = require('fs');
const files = fs.readdirSync('tests/migration').filter(f => f.endsWith('.ts'));
files.forEach(f => {
  let c = fs.readFileSync('tests/migration/' + f, 'utf8');
  c = c.replace(/backend\//g, 'lib/');
  fs.writeFileSync('tests/migration/' + f, c);
});
