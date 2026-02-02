import { markdownToADF } from './markdownToADF.js';

/**
 * Updates an existing Jira issue
 * @param {string} issueKey - The issue key (e.g., 'PROJ-123')
 * @param {Object} updates - Fields to update
 * @param {string} [updates.summary] - New summary/title
 * @param {string} [updates.description] - New description (supports Markdown)
 * @param {string} [updates.priority] - New priority
 * @param {Array<string>} [updates.labels] - New labels (replaces existing)
 * @param {string} [updates.assignee] - New assignee account ID
 * @returns {Promise<Object>} The update response
 */
export async function updateJiraIssue(issueKey, updates = {}) {
  // Validate required fields
  if (!issueKey) {
    throw new Error('Missing required field: issueKey is required');
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No updates provided');
  }

  // Get configuration from environment
  const jiraUrl = process.env.JIRA_URL;
  const jiraEmail = process.env.JIRA_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;

  if (!jiraUrl || !jiraEmail || !jiraApiToken) {
    throw new Error('Missing Jira configuration. Please set JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN in .env');
  }

  // Build the update payload
  const fields = {};

  if (updates.summary !== undefined) {
    fields.summary = updates.summary;
  }

  if (updates.description !== undefined) {
    // Convert Markdown description to ADF
    if (updates.description) {
      fields.description = markdownToADF(updates.description);
    } else {
      fields.description = {
        type: 'doc',
        version: 1,
        content: []
      };
    }
  }

  if (updates.priority !== undefined) {
    fields.priority = {
      name: updates.priority
    };
  }

  if (updates.assignee !== undefined) {
    fields.assignee = {
      id: updates.assignee
    };
  }

  if (updates.labels !== undefined && Array.isArray(updates.labels)) {
    fields.labels = updates.labels;
  }

  const payload = { fields };

  // Make the API call to Jira
  console.log(`→ Sending update request to Jira API: PUT ${jiraUrl}/rest/api/3/issue/${issueKey}`);
  console.log('  Updating fields:', Object.keys(fields).join(', '));

  const response = await fetch(`${jiraUrl}/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`✗ Jira API update request failed with status ${response.status}`);
    throw new Error(`Jira API error (${response.status}): ${errorText}`);
  }

  console.log(`✓ Jira API update request successful (${response.status})`);
  
  // PUT returns 204 No Content on success
  return {
    success: true,
    issueKey: issueKey,
    updatedFields: Object.keys(fields)
  };
}
