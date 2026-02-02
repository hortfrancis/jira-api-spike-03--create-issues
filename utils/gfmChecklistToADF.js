/**
 * Converts GFM Markdown checklist to ADF taskList/taskItem format
 * 
 * Input example:
 * - [ ] Item 1
 * - [x] Item 2
 *   - [ ] Nested 2.1
 *     - [x] Nested 2.1.a
 *
 * Output:
 * { type:"taskList", attrs:{localId}, content:[ taskItem, taskItem, taskList(nested), ... ] }
 * 
 * @param {string} markdown - The GFM checklist markdown
 * @param {Object} [options={}] - Options
 * @param {number} [options.indentSize=2] - Number of spaces per indent level
 * @returns {object} ADF taskList structure
 */
export function gfmChecklistToADF(markdown, options = {}) {
  const indentSize = options.indentSize ?? 2;
  const uuid = options.uuid ?? defaultUuid;

  const lines = String(markdown)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\t/g, " ".repeat(indentSize)))
    .filter((l) => l.trim().length > 0);

  const items = [];
  for (const line of lines) {
    const parsed = parseChecklistLine(line);
    if (!parsed) continue;
    items.push(parsed);
  }

  if (items.length === 0) {
    return {
      type: "doc",
      version: 1,
      content: []
    };
  }

  const root = { level: -1, children: [] };
  const stack = [root];

  for (const it of items) {
    const level = Math.floor(it.indent / indentSize);
    const node = { level, state: it.state, text: it.text, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  const taskList = treeToTaskList(root.children, uuid);

  // Wrap in ADF doc format
  return {
    type: "doc",
    version: 1,
    content: [taskList]
  };
}

function parseChecklistLine(line) {
  const m = line.match(/^(\s*)([-*])\s+\[(\s|x|X)?\]\s*(.*)$/);
  if (!m) return null;

  const indent = m[1].length;
  const mark = m[3];
  const text = (m[4] ?? "").trim();
  const state = mark === "x" || mark === "X" ? "DONE" : "TODO";

  return { indent, state, text };
}

function treeToTaskList(nodes, uuid) {
  const taskList = {
    type: "taskList",
    attrs: { localId: uuid() },
    content: [],
  };

  for (const n of nodes) {
    taskList.content.push({
      type: "taskItem",
      attrs: { localId: uuid(), state: n.state },
      content: [{ type: "text", text: n.text }],
    });

    if (n.children && n.children.length) {
      taskList.content.push(treeToTaskList(n.children, uuid));
    }
  }

  return taskList;
}

function defaultUuid() {
  try {
    const c = globalThis.crypto || require("crypto");
    if (typeof c.randomUUID === "function") return c.randomUUID();
  } catch {}
  return `id-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}
