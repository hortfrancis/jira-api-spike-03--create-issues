import { markdownToADF } from '../utils/markdownToADF.js';
import { gfmChecklistToADF } from '../utils/gfmChecklistToADF.js';

// Define markdown snippets
const heading = '# Project Implementation Plan';

const introParagraph = 'This document outlines the complete implementation plan for the new feature. Please review all sections carefully before beginning work.';

const bulletPoints = `## Key Requirements

- Must be backwards compatible
- Should follow existing code patterns
- Must include comprehensive tests
- Documentation is required`;

const checklist1 = `- [ ] Set up development environment
- [ ] Create feature branch
- [ ] Review existing codebase
  - [ ] Identify integration points
  - [ ] Document dependencies`;

const subheading = '## Implementation Steps';

const checklist2 = `- [ ] Write unit tests
  - [ ] Test happy path
  - [ ] Test error cases
- [ ] Implement core functionality
- [ ] Update documentation
  - [ ] API documentation
  - [ ] User guide
  - [ ] Changelog
- [ ] Code review
- [ ] Merge to main`;

const conclusionParagraph = '**Note:** All checklist items must be completed before submitting for final review.';

// Assemble the full markdown document
const fullMarkdown = `${heading}

${introParagraph}

${bulletPoints}

## Development Checklist

${checklist1}

${subheading}

${checklist2}

${conclusionParagraph}`;

console.log('='.repeat(80));
console.log('FULL MARKDOWN DOCUMENT');
console.log('='.repeat(80));
console.log(fullMarkdown);
console.log('\n\n');

// Convert using standard markdownToADF (Atlassian's transformer)
console.log('='.repeat(80));
console.log('CONVERSION USING STANDARD markdownToADF (Atlassian Transformer)');
console.log('='.repeat(80));
const standardADF = markdownToADF(fullMarkdown);
console.log(JSON.stringify(standardADF, null, 2));
console.log('\n\n');

// Convert checklists using custom gfmChecklistToADF
console.log('='.repeat(80));
console.log('CONVERSION USING CUSTOM gfmChecklistToADF (First Checklist Only)');
console.log('='.repeat(80));
const customChecklist1ADF = gfmChecklistToADF(checklist1);
console.log(JSON.stringify(customChecklist1ADF, null, 2));
console.log('\n\n');

console.log('='.repeat(80));
console.log('CONVERSION USING CUSTOM gfmChecklistToADF (Second Checklist Only)');
console.log('='.repeat(80));
const customChecklist2ADF = gfmChecklistToADF(checklist2);
console.log(JSON.stringify(customChecklist2ADF, null, 2));
console.log('\n\n');

// Create a hybrid document combining standard markdown and custom checklist conversion
console.log('='.repeat(80));
console.log('HYBRID APPROACH: Combining Both Converters');
console.log('='.repeat(80));

// Convert non-checklist parts with standard markdown
const nonChecklistMarkdown = `${heading}

${introParagraph}

${bulletPoints}

## Development Checklist

${subheading}

${conclusionParagraph}`;

const baseADF = markdownToADF(nonChecklistMarkdown);
const checklist1Content = gfmChecklistToADF(checklist1).content[0]; // Extract taskList
const checklist2Content = gfmChecklistToADF(checklist2).content[0]; // Extract taskList

// Insert checklists into the document at appropriate positions
// This is a demonstration - in production you'd need more sophisticated merging
const hybridADF = {
  type: 'doc',
  version: 1,
  content: [
    ...baseADF.content.slice(0, 3), // heading, paragraph, bullet list section
    checklist1Content, // First checklist
    ...baseADF.content.slice(3, 4), // subheading
    checklist2Content, // Second checklist
    ...baseADF.content.slice(4), // conclusion paragraph
  ]
};

console.log(JSON.stringify(hybridADF, null, 2));
