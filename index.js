import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createJiraIssue } from './utils/createJiraIssue.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});