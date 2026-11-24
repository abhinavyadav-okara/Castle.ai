"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE = '{"name":"Castle.ai","tags":["ai","nextjs"],"stars":42,"open_source":true,"owner":null,"meta":{"version":1.5}}';

// Work out line/column from a JSON.parse error message and the source text.
function describeError(err, text) {
  const msg = err && err.message ? err.message : String(err);
  let line = null;
  let column = null;

  const lc = msg.match(/line (\d+) column (\d+)/i);
  if (lc) {
    line = Number(lc[1]);
    column = Number(lc[2]);
  } else {
    const pos = msg.match(/position (\d+)/i);
    if (pos) {
      const index = Math.min(Number(pos[1]), text.length);
      const before = text.slice(0, index).split("\n");
      line = before.length;
      column = before[before.length - 1].length + 1;
    } else if (/end of (json|data)|unexpected end/i.test(msg)) {
      const all = text.split("\n");
      line = all.length;
      column = all[all.length - 1].length + 1;
    }
  }
  return { message: msg, line, column };
}

// Infer a JSON Schema (draft-07 style) from a parsed value.
function inferSchema(value) {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    const schema = { type: "array" };
    if (value.length === 0) return schema;
    const variants = [];
    const seen = new Set();
    for (const item of value) {
      const s = inferSchema(item);
      const key = JSON.stringify(s);
      if (!seen.has(key)) {
        seen.add(key);
        variants.push(s);
      }
    }
    schema.items = variants.length === 1 ? variants[0] : { anyOf: variants };
    return schema;
  }
  switch (typeof value) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: Number.isInteger(value) ? "integer" : "number" };
    case "boolean":
      return { type: "boolean" };
    default: {
      const keys = Object.keys(value);
      const schema = { type: "object", properties: {} };
      for (const k of keys) schema.properties[k] = inferSchema(value[k]);
      if (keys.length) schema.required = keys;
      return schema;
    }
  }
}

const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

// Simple hand-written syntax colouring; returns React nodes.
function highlight(code) {
  const nodes = [];
  let last = 0;
  let i = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code)) !== null) {
    if (m.index > last) nodes.push(code.slice(last, m.index));
    let cls;
    if (m[1] !== undefined) {
      cls = m[2] ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400";
      nodes.push(
        <span key={i++} className={cls}>
          {m[1]}
        </span>
      );
      if (m[2]) nodes.push(m[2]);
    } else {
      if (m[3]) cls = "text-purple-600 dark:text-purple-400";
      else if (m[0] === "null") cls = "text-neutral-500";
      else cls = "text-amber-600 dark:text-amber-400";
      nodes.push(
        <span key={i++} className={cls}>
          {m[0]}
        </span>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}

function CopyButton({ text, disabled }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={copy} disabled={disabled}>
      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export default function JsonFormatterClient() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState("2");
  const [minify, setMinify] = useState(false);
  const [withSchema, setWithSchema] = useState(false);

  useEffect(() => setMounted(true), []);

  const result = useMemo(() => {
    if (!input.trim()) return { empty: true };
    try {
      const parsed = JSON.parse(input);
      const space = indent === "tab" ? "\t" : Number(indent);
      const output = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, space);
      const schema = withSchema
        ? JSON.stringify(
            { $schema: "http://json-schema.org/draft-07/schema#", ...inferSchema(parsed) },
            null,
            space
          )
        : "";
      return { output, schema };
    } catch (err) {
      return { error: describeError(err, input) };
    }
  }, [input, indent, minify, withSchema]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          <span>🔮</span>
          <span>Castle.ai</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="w-9 h-9"
          aria-label="Toggle theme"
        >
          {mounted && theme === "light" ? (
            <Moon className="h-5 w-5 text-black" />
          ) : (
            <Sun className="h-5 w-5 text-white" />
          )}
        </Button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          JSON Formatter &amp; Validator
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-2xl">
          Paste messy or minified JSON to format it, check that it is valid, and optionally
          generate a JSON Schema from it. Everything runs in your browser; nothing is uploaded.
        </p>

        <div className="rounded-lg border border-gray-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4 mb-8 text-sm">
          Working with AI API responses? Castle.ai is an open-source Next.js AI app template —
          fork it to skip the setup.
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          <label className="flex items-center gap-2">
            Indentation
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="8">8 spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} />
            Minify output
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={withSchema}
              onChange={(e) => setWithSchema(e.target.checked)}
            />
            Generate JSON Schema
          </label>
          <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
            Load example
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInput("")}>
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold mb-2">Input JSON</h2>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder='Paste JSON here, e.g. {"hello":"world"}'
              className="w-full h-96 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 font-mono text-sm"
            />
            <div className="mt-2 text-sm" aria-live="polite">
              {result.empty && (
                <span className="text-neutral-500">Waiting for JSON input.</span>
              )}
              {result.error && (
                <span className="text-red-600 dark:text-red-400">
                  Invalid JSON
                  {result.error.line
                    ? ` (line ${result.error.line}, column ${result.error.column})`
                    : ""}
                  : {result.error.message}
                </span>
              )}
              {result.output !== undefined && (
                <span className="text-emerald-600 dark:text-emerald-400">Valid JSON.</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{minify ? "Minified JSON" : "Formatted JSON"}</h2>
              <CopyButton text={result.output || ""} disabled={!result.output} />
            </div>
            <pre className="w-full h-96 overflow-auto rounded-lg border border-gray-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-3 font-mono text-sm whitespace-pre-wrap break-all">
              {result.output ? highlight(result.output) : ""}
            </pre>
          </div>
        </div>

        {withSchema && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Inferred JSON Schema</h2>
              <CopyButton text={result.schema || ""} disabled={!result.schema} />
            </div>
            <pre className="w-full max-h-96 overflow-auto rounded-lg border border-gray-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-3 font-mono text-sm whitespace-pre-wrap">
              {result.schema ? highlight(result.schema) : "Enter valid JSON to generate a schema."}
            </pre>
            <p className="text-xs text-neutral-500 mt-2">
              The schema is inferred from this one sample, so treat it as a starting point: every
              key present is marked required.
            </p>
          </div>
        )}

        <section className="mt-12 max-w-2xl">
          <h2 className="text-xl font-bold mb-2">How to use</h2>
          <ol className="list-decimal pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
            <li>Paste your JSON into the input box.</li>
            <li>Pick an indentation size, or tick Minify to compact it.</li>
            <li>If the JSON is invalid, the error message shows the line and column.</li>
            <li>Tick Generate JSON Schema to infer a schema, then copy the result.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
