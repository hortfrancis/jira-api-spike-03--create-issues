import { MarkdownTransformer } from "@atlaskit/editor-markdown-transformer";
import { JSONTransformer } from "@atlaskit/editor-json-transformer";
import adfSchemaPackage from "@atlaskit/adf-schema";

const { defaultSchema } = adfSchemaPackage;

const md = `
## Context

This description came from **Markdown**.

- First item
- Second item
`;

const md2 = `
- [] checkbox unchecked
- [x] checkbox checked

> Blockquote example
`;

const mdTransformer = new MarkdownTransformer(defaultSchema);
const pmDoc = mdTransformer.parse(md2);      // Markdown → ProseMirror
const jsonTransformer = new JSONTransformer();
const adfDoc = jsonTransformer.encode(pmDoc); // ProseMirror → ADF JSON

console.log(JSON.stringify(adfDoc, null, 2));
