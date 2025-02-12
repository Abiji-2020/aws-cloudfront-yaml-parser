import * as fs from 'fs';

function readFileSync(path: string): string {
  return fs.readFileSync(path, 'utf8');
}

const filePath = "test.yaml";
const content = readFileSync(filePath);

console.log(content);