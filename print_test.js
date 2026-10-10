import fs from 'fs';
let content = fs.readFileSync('src/tests/integration/phase-6.test.ts', 'utf8');
content = content.replace("expect(successes.length).toBe(3);", "console.log('RESULTS:', results); expect(successes.length).toBe(3);");
fs.writeFileSync('src/tests/integration/phase-6.test.ts', content);
