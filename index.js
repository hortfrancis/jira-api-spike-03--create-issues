import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createJiraIssue } from './createJiraIssue.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Jira API Spike - Create Issues');
});

// POST endpoint to create a new Jira issue
app.post('/api/issues', async (req, res) => {
  try {
    const { summary, description, ...options } = req.body;
    const result = await createJiraIssue(summary, description, options);
    
    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      issue: result
    });
  } catch (error) {
    console.error('Error creating Jira issue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});