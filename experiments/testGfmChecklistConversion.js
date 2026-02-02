import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { gfmChecklistToADF } from '../utils/gfmChecklistToADF.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the checklist markdown file
const checklistPath = join(__dirname, '../jira/issue-context/make-new-endpoint.checklist.md');
const markdown = readFileSync(checklistPath, 'utf-8');

console.log('Input GFM Markdown:');
console.log('-------------------');
console.log(markdown);
console.log('\n');

// Convert to ADF
const adfDoc = gfmChecklistToADF(markdown);

console.log('Output ADF (Atlassian Document Format):');
console.log('----------------------------------------');
console.log(JSON.stringify(adfDoc, null, 2));
