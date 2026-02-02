import { markdownToADF } from './markdownToADF.js';

/**
 * Creates a new Jira issue
 * @param {string} summary - The display name/title of the issue
 * @param {string} description - The description field (supports Markdown)
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.projectKey] - The project key (e.g., 'PROJ'). Defaults to JIRA_PROJECT_KEY env var
 * @param {string} [options.issueType='Task'] - The issue type (e.g., 'Task', 'Bug', 'Story')
 * @param {string} [options.priority] - The priority (e.g., 'High', 'Medium', 'Low')
 * @param {string} [options.assignee] - The assignee account ID
 * @param {Array<string>} [options.labels] - Array of labels to add to the issue
 * @returns {Promise<Object>} The created issue response
 */
export async function createJiraIssue(summary, description, options = {}) {
  // Validate required fields
  if (!summary) {
    throw new Error('Missing required field: summary is required');
  }

  // Get configuration from environment or options
  const jiraUrl = process.env.JIRA_URL;
  const jiraEmail = process.env.JIRA_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;
  const projectKey = options.projectKey || process.env.JIRA_PROJECT_KEY;

  if (!jiraUrl || !jiraEmail || !jiraApiToken) {
    throw new Error('Missing Jira configuration. Please set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN in .env');
  }

  if (!projectKey) {
    throw new Error('Missing project key. Please provide options.projectKey or set JIRA_PROJECT_KEY in .env');
  }

  const issueType = options.issueType || 'Task';

  // Convert Markdown description to ADF
  let descriptionADF;
  if (description) {
    descriptionADF = markdownToADF(description);
  } else {
    // Empty ADF document
    descriptionADF = {
      type: 'doc',
      version: 1,
      content: []
    };
  }

  // Prepare the issue payload
  const payload = {
    fields: {
      project: {
        key: projectKey
      },
      summary: summary,
      description: descriptionADF,
      issuetype: {
        name: issueType
      }
    }
  };

  // Add optional fields if provided
  if (options.priority) {
    payload.fields.priority = {
      name: options.priority
    };
  }

  if (options.assignee) {
    payload.fields.assignee = {
      id: options.assignee
    };
  }

  if (options.labels && Array.isArray(options.labels)) {
    payload.fields.labels = options.labels;
  }

  // Make the API call to Jira
  console.log(`→ Sending request to Jira API: POST ${jiraUrl}/rest/api/3/issue`);
  console.log('  Project:', projectKey, '| Type:', issueType, '| Summary:', summary.substring(0, 50) + (summary.length > 50 ? '...' : ''));
  
  const response = await fetch(`${jiraUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`✗ Jira API request failed with status ${response.status}`);
    throw new Error(`Jira API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log(`✓ Jira API request successful (${response.status})`);
  return result;
}
