import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createJiraIssue } from './utils/createJiraIssue.js';
import { updateJiraIssue } from './utils/updateJiraIssue.js';
import { createJiraIssueWithChecklist } from './utils/createJiraIssueWithChecklist.js';
import { createJiraIssueWithMixedContent } from './utils/createJiraIssueWithMixedContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Jira API Spike - Create Issues');
});

// POST endpoint to create a new Jira issue
app.post('/api/issues', async (req, res) => {
  try {
    const { summary, description, ...options } = req.body;
    console.log('Creating Jira issue with summary:', summary);
    
    const result = await createJiraIssue(summary, description, options);
    
    console.log('✓ Issue created successfully:', result.key);
    console.log('  URL:', result.self);
    
    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      issue: result
    });
  } catch (error) {
    console.error('✗ Error creating Jira issue:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST endpoint to create a Jira issue with GFM checklist
app.post('/api/issues/checklist', async (req, res) => {
  try {
    const { summary, checklist, ...options } = req.body;
    console.log('Creating Jira issue with GFM checklist:', summary);
    
    const result = await createJiraIssueWithChecklist(summary, checklist, options);
    
    console.log('✓ Issue with checklist created successfully:', result.key);
    console.log('  URL:', result.self);
    
    res.status(201).json({
      success: true,
      message: 'Issue with checklist created successfully',
      issue: result
    });
  } catch (error) {
    console.error('✗ Error creating Jira issue with checklist:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST endpoint to create a pre-written issue from file
app.post('/api/issues/prewritten', async (req, res) => {
  try {
    const { summary, ...options } = req.body;
    
    // Read the pre-written checklist from file
    const checklistPath = join(__dirname, 'jira/issue-context/make-new-endpoint.checklist.md');
    const checklist = readFileSync(checklistPath, 'utf-8');
    
    console.log('Creating Jira issue with pre-written checklist:', summary);
    
    const result = await createJiraIssueWithChecklist(summary, checklist, options);
    
    console.log('✓ Pre-written issue created successfully:', result.key);
    console.log('  URL:', result.self);
    
    res.status(201).json({
      success: true,
      message: 'Pre-written issue created successfully',
      issue: result
    });
  } catch (error) {
    console.error('✗ Error creating pre-written issue:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST endpoint to create a pre-written issue with mixed markdown and checklists
app.post('/api/issues/prewritten-mixed', async (req, res) => {
  try {
    const { summary, ...options } = req.body;
    
    // Define the mixed content sections
    const content = {
      heading: '# Project Implementation Plan',
      introParagraph: 'This document outlines the complete implementation plan for the new feature. Please review all sections carefully before beginning work.',
      bulletPoints: `## Key Requirements

- Must be backwards compatible
- Should follow existing code patterns
- Must include comprehensive tests
- Documentation is required`,
      checklist1: `- [ ] Set up development environment
- [ ] Create feature branch
- [ ] Review existing codebase
  - [ ] Identify integration points
  - [ ] Document dependencies`,
      subheading: '## Implementation Steps',
      checklist2: `- [ ] Write unit tests
  - [ ] Test happy path
  - [ ] Test error cases
- [ ] Implement core functionality
- [ ] Update documentation
  - [ ] API documentation
  - [ ] User guide
  - [ ] Changelog
- [ ] Code review
- [ ] Merge to main`,
      conclusionParagraph: '**Note:** All checklist items must be completed before submitting for final review.'
    };
    
    console.log('Creating Jira issue with pre-written mixed content:', summary);
    
    const result = await createJiraIssueWithMixedContent(summary, content, options);
    
    console.log('✓ Pre-written mixed issue created successfully:', result.key);
    console.log('  URL:', result.self);
    
    res.status(201).json({
      success: true,
      message: 'Pre-written mixed issue created successfully',
      issue: result
    });
  } catch (error) {
    console.error('✗ Error creating pre-written mixed issue:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT endpoint to update an existing Jira issue
app.put('/api/issues/:issueKey', async (req, res) => {
  try {
    const { issueKey } = req.params;
    console.log('Updating Jira issue:', issueKey);
    
    const result = await updateJiraIssue(issueKey, req.body);
    
    console.log('✓ Issue updated successfully:', issueKey);
    console.log('  Updated fields:', result.updatedFields.join(', '));
    
    res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      result: result
    });
  } catch (error) {
    console.error('✗ Error updating Jira issue:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});