/**
 * GFM Markdown checklist -> ADF taskList/taskItem
 *
 * Input example:
 * - [ ] Item 1
 * - [x] Item 2
 *   - [ ] Nested 2.1
 *     - [x] Nested 2.1.a
 *
 * Output:
 * { type:"taskList", attrs:{localId}, content:[ taskItem, taskItem, taskList(nested), ... ] }
 */

function gfmChecklistToAdfTaskList(markdown, options = {}) {
  const indentSize = options.indentSize ?? 2; // treat 2 spaces as one nesting level by default
  const uuid = options.uuid ?? defaultUuid;

  const lines = String(markdown)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\t/g, " ".repeat(indentSize))) // tabs -> spaces
    .filter((l) => l.trim().length > 0);

  // Parse only checklist lines. You can relax this if you want to allow other lines.
  const items = [];
  for (const line of lines) {
    const parsed = parseChecklistLine(line);
    if (!parsed) continue;
    items.push(parsed);
  }

  if (items.length === 0) {
    return {
      type: "taskList",
      attrs: { localId: uuid() },
      content: [],
    };
  }

  // Build a tree of items based on indentation level
  // Each node: { state, text, level, children: [] }
  const root = { level: -1, children: [] };
  const stack = [root];

  for (const it of items) {
    // compute nesting level from indentation
    const level = Math.floor(it.indent / indentSize);

    const node = { level, state: it.state, text: it.text, children: [] };

    // Pop until we find a parent with smaller level
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    // Parent is now top of stack
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  // Convert tree -> Jira-style ADF taskList structure
  return treeToTaskList(root.children, uuid);
}

function parseChecklistLine(line) {
  // Matches:
  //   <indent>- [ ] text
  //   <indent>- [x] text
  //   <indent>- [] text  (common typo)
  //
  // Also accepts "*" instead of "-" if someone writes GFM with "* [ ]"
  const m = line.match(/^(\s*)([-*])\s+\[(\s|x|X)?\]\s*(.*)$/);
  if (!m) return null;

  const indent = m[1].length;
  const mark = m[3];
  const text = (m[4] ?? "").trim();

  const state = mark === "x" || mark === "X" ? "DONE" : "TODO";

  // If someone wrote "- [] item" then mark is undefined; treat as TODO (unchecked)
  return { indent, state, text };
}

function treeToTaskList(nodes, uuid) {
  const taskList = {
    type: "taskList",
    attrs: { localId: uuid() },
    content: [],
  };

  for (const n of nodes) {
    // Add the task item
    taskList.content.push({
      type: "taskItem",
      attrs: { localId: uuid(), state: n.state },
      // Jira often returns inline text nodes directly in taskItem.content
      content: [{ type: "text", text: n.text }],
    });

    // If it has children, append a nested taskList as a sibling (Jira-style)
    if (n.children && n.children.length) {
      taskList.content.push(treeToTaskList(n.children, uuid));
    }
  }

  return taskList;
}

function defaultUuid() {
  // Browser / modern node: crypto.randomUUID
  try {
    const c = globalThis.crypto || require("crypto");
    if (typeof c.randomUUID === "function") return c.randomUUID();
  } catch {}
  // fallback: "good enough" unique string
  return `id-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/* -------------------------
   Quick demo
-------------------------- */
const md = `
- [ ] Checklist item 1
- [ ] Checklist item 2
  - [ ] Nested checklist item level 1
    - [ ] Nested checklist item level 2
  - [x] Another nested (checked)
- [] Supports - [] too
`;

const adf = gfmChecklistToAdfTaskList(md, { indentSize: 2 });

console.log(JSON.stringify(adf, null, 2));



// import { MarkdownTransformer } from "@atlaskit/editor-markdown-transformer";
// import { JSONTransformer } from "@atlaskit/editor-json-transformer";
// import adfSchemaPackage from "@atlaskit/adf-schema";

// const { defaultSchema } = adfSchemaPackage;

// const md = `
// - [] checkbox unchecked
// - [x] checkbox checked
//   - [] nested checkbox unchecked lvl 1
//   - [x] nested checkbox checked lvl 1
//     - [] nested checkbox unchecked lvl 2
//     - [x] nested checkbox checked lvl 2
// `;

// const mdTransformer = new MarkdownTransformer(defaultSchema);
// const pmDoc = mdTransformer.parse(md);      // Markdown → ProseMirror
// const jsonTransformer = new JSONTransformer();
// const adfDoc = jsonTransformer.encode(pmDoc); // ProseMirror → ADF JSON

// console.log(JSON.stringify(adfDoc, null, 2));