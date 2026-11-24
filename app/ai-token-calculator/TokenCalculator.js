"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

// SAMPLE DATA: USD per 1M tokens. Prices change often; verify against each
// provider's pricing page and edit this table to update the calculator.
const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", input: 2.5, output: 10 },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI", input: 0.15, output: 0.6 },
  { id: "claude-35-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", input: 3, output: 15 },
  { id: "claude-35-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", input: 0.8, output: 4 },
  { id: "gemini-15-pro", name: "Gemini 1.5 Pro", provider: "Google", input: 1.25, output: 5 },
  { id: "gemini-15-flash", name: "Gemini 1.5 Flash", provider: "Google", input: 0.075, output: 0.3 },
];

// Rough estimate: about 4 characters per token for English text.
const CHARS_PER_TOKEN = 4;

const fmt = (n) =>
  n < 0.01 && n > 0
    ? `$${n.toFixed(5)}`
    : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TokenCalculator() {
  const [text, setText] = useState("");
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [requests, setRequests] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);

  const inputTokens = useMemo(() => Math.ceil(text.length / CHARS_PER_TOKEN), [text]);
  const reqs = Math.max(0, Number(requests) || 0);
  const outs = Math.max(0, Number(outputTokens) || 0);

  const costFor = (m) => (inputTokens * m.input + outs * m.output) / 1_000_000;
  const selected = MODELS.find((m) => m.id === modelId);
  const perRequest = costFor(selected);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">AI Token Calculator</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
          Paste a prompt to estimate its token count and compare what it costs per request and per month across
          OpenAI, Anthropic and Google models. Everything runs in your browser; nothing is sent anywhere.
        </p>

        <label htmlFor="prompt" className="block text-sm font-medium mb-2">Prompt or text</label>
        <textarea
          id="prompt"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste your prompt here..."
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-2">Model</label>
            <select
              id="model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:bg-black"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.provider} – {m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="requests" className="block text-sm font-medium mb-2">Requests per month</label>
            <Input id="requests" type="number" min="0" value={requests} onChange={(e) => setRequests(e.target.value)} />
          </div>
          <div>
            <label htmlFor="output" className="block text-sm font-medium mb-2">Expected output tokens</label>
            <Input id="output" type="number" min="0" value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} />
          </div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8" aria-live="polite">
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <div className="text-xs text-neutral-500">Estimated input tokens</div>
            <div className="text-2xl font-bold">{inputTokens.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <div className="text-xs text-neutral-500">Cost per request ({selected.name})</div>
            <div className="text-2xl font-bold">{fmt(perRequest)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <div className="text-xs text-neutral-500">Cost per month</div>
            <div className="text-2xl font-bold">{fmt(perRequest * reqs)}</div>
          </div>
        </section>

        <h2 className="text-2xl font-bold mt-12 mb-4">LLM pricing comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-950">
              <tr>
                <th className="p-3">Model</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Input $/1M</th>
                <th className="p-3">Output $/1M</th>
                <th className="p-3">Per request</th>
                <th className="p-3">Per month</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.id} className="border-t border-gray-200 dark:border-neutral-800">
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3">{m.provider}</td>
                  <td className="p-3">${m.input}</td>
                  <td className="p-3">${m.output}</td>
                  <td className="p-3">{fmt(costFor(m))}</td>
                  <td className="p-3">{fmt(costFor(m) * reqs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
          Token counts are estimates using roughly {CHARS_PER_TOKEN} characters per token. Each provider uses its own
          tokenizer, so real counts for GPT, Claude and Gemini will differ. Prices in the table are sample data in
          USD per million tokens and may be out of date; check each provider&apos;s pricing page before budgeting.
        </p>

        <section className="mt-12 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
          <h2 className="text-xl font-bold mb-2">Building an AI app?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Castle.ai is a free, open-source AI application template built and maintained by Metaschool. Developers
            fork it as a starting point for their own AI-powered products, and it includes login and register flows.
          </p>
          <Link
            href="https://castle-ai.vercel.app"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Explore Castle.ai
          </Link>
        </section>
      </main>
    </div>
  );
}
