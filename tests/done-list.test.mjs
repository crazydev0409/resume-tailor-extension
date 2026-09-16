import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" });
for (const name of ["window", "document", "navigator", "HTMLElement", "MutationObserver"])
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement, act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { Simulate } = await import("react-dom/test-utils");
const require = createRequire(import.meta.url);
const compiled = buildSync({
  entryPoints: ["src/components/ext/DoneList.tsx"], bundle: true,
  platform: "node", format: "cjs", packages: "external", jsx: "automatic", write: false,
}).outputFiles[0].text;
const componentModule = { exports: {} };
new Function("require", "module", "exports", compiled)(require, componentModule, componentModule.exports);
const { DoneList } = componentModule.exports;

const description = "++hellohello is a digital experience agency where exceptional talent comes together to design and build brands";
const companies = ["Lockheed Martin Corporation", "Peraton", "Airlock Digital", "++hellohello"];
const items = companies.map((companyName, index) => ({
  id: "duplicate-legacy-id", companyName, role: index === 3 ? "Sr. iOS Engineer" : "Software Engineer",
  timestamp: Date.now() - index * 1000, jobDescription: index === 3 ? description : "Unrelated posting",
  note: index === 3 ? "Follow up Friday" : undefined, pinned: false,
  model: "test", tailoredResume: "", originalResume: "", apiUrl: "", sourceUrl: "",
}));
const noop = () => {};

test("filter transitions remove unrelated cards even when saved IDs repeat", async () => {
  const root = createRoot(document.getElementById("root"));
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args.join(" "));
  try {
    await act(async () => root.render(createElement(DoneList, {
      items, onViewItem: noop, onRemoveItem: noop, onClearAll: noop,
      onUpdateItem: noop, onTogglePin: noop, hasWorkingItems: false,
    })));
    const search = async (value) => act(async () => {
      Simulate.change(document.querySelector("input"), { target: { value } });
    });
    const cards = () => [...document.querySelectorAll(".group")].map(el => el.textContent);
    await search("Peraton");
    assert.equal(cards().length, 1);
    await search("nothing-matches-this");
    assert.equal(cards().length, 0, "no stale cards should remain in the empty state");
    assert.match(document.body.textContent, /No matching resumes/);
    await search("");
    assert.equal(cards().length, 4);
    await search(description.replaceAll(" ", "  ").toUpperCase());
    assert.equal(cards().length, 1, "pasted description should find its saved resume");
    assert.match(cards()[0], /\+\+hellohello/);
    await search("hellohello ios");
    assert.equal(cards().length, 1);
    await search("friday");
    assert.equal(cards().length, 1);
    await act(async () => Simulate.click(document.querySelector('[aria-label="Clear search"]')));
    assert.equal(cards().length, 4);
    assert.equal(errors.length, 0, errors.join("\n"));
  } finally {
    await act(async () => root.unmount());
    console.error = originalError;
  }
});
