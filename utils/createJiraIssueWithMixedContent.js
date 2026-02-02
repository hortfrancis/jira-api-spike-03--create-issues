import { markdownToADF } from './markdownToADF.js';
import { gfmChecklistToADF } from './gfmChecklistToADF.js';

/**
 * Creates a Jira issue with mixed markdown and GFM checklist content
 * @param {string} summary - The issue summary
 * @param {Object} content - Object containing markdown and checklist sections
 * @param {string} [content.heading] - Heading text
 * @param {string} [content.introParagraph] - Introduction paragraph
 * @param {string} [content.bulletPoints] - Markdown bullet points section
 * @param {string} [content.checklist1] - First GFM checklist
 * @param {string} [content.subheading] - Subheading text
 * @param {string} [content.checklist2] - Second GFM checklist
 * @param {string} [content.conclusionParagraph] - Conclusion paragraph
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<Object>} The created issue response
 */
export async function createJiraIssueWithMixedContent(summary, content, options = {}) {
  if (!summary) {
    throw new Error('Missing required field: summary is required');
  }

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

  // Assemble markdown sections
  const sections = [];
  
  if (content.heading) sections.push(content.heading);
  if (content.introParagraph) sections.push(content.introParagraph);
  if (content.bulletPoints) sections.push(content.bulletPoints);
  if (content.subheading) sections.push(content.subheading);
  if (content.conclusionParagraph) sections.push(content.conclusionParagraph);

  // Create base markdown (everything except checklists)
  const baseMarkdown = sections.join('\n\n');
  const baseADF = markdownToADF(baseMarkdown);

  // Convert checklists to ADF
  const adfContent = [...baseADF.content];
  
  // Insert checklists at appropriate positions
  if (content.checklist1) {
    const checklist1Content = gfmChecklistToADF(content.checklist1).content[0];
    // Insert after bullet points section (typically after heading, intro, bulletPoints)
    const insertPosition = content.bulletPoints ? 3 : 2;
    adfContent.splice(insertPosition, 0, checklist1Content);
  }
  
  if (content.checklist2) {
    const checklist2Content = gfmChecklistToADF(content.checklist2).content[0];
    // Insert before conclusion (or at the end if no conclusion)
    const insertPosition = content.conclusionParagraph ? adfContent.length - 1 : adfContent.length;
    adfContent.splice(insertPosition, 0, checklist2Content);
  }

  const descriptionADF = {
    type: 'doc',
    version: 1,
    content: adfContent
  };

  // Prepare the issue payload
  const payload = {
    fields: {
      project: { key: projectKey },
      summary: summary,
      description: descriptionADF,
      issuetype: { name: issueType }
    }
  };

  // Add optional fields
  if (options.priority) {
    payload.fields.priority = { name: options.priority };
  }

  if (options.assignee) {
    payload.fields.assignee = { id: options.assignee };
  }

  if (options.labels && Array.isArray(options.labels)) {
    payload.fields.labels = options.labels;
  }

  // Make the API request to Jira
  const auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
  
  const response = await fetch(`${jiraUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result;
}
