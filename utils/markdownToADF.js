import { MarkdownTransformer } from "@atlaskit/editor-markdown-transformer";
import { JSONTransformer } from "@atlaskit/editor-json-transformer";
import adfSchemaPackage from "@atlaskit/adf-schema";

const { defaultSchema } = adfSchemaPackage;

/**
 * Converts Markdown text to Atlassian Document Format (ADF) JSON
 * @param {string} markdown - The markdown text to convert
 * @returns {object} The ADF JSON document
 */
export function markdownToADF(markdown) {
  const mdTransformer = new MarkdownTransformer(defaultSchema);
  const pmDoc = mdTransformer.parse(markdown);
  const jsonTransformer = new JSONTransformer();
  const adfDoc = jsonTransformer.encode(pmDoc);
  return adfDoc;
}
