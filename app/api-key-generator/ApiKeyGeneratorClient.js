"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ALPHABETS = {
  hex: "0123456789abcdef",
  base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  alphanumeric:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
};

const FORMATS = [
  { value: "hex", label: "Hex" },
  { value: "base64", label: "Base64 (URL-safe)" },
  { value: "alphanumeric", label: "Alphanumeric" },
  { value: "uuid", label: "UUID-style (hex with dashes)" },
];

// Unbiased random characters via crypto.getRandomValues and rejection sampling.
function randomChars(alphabet, length) {
  const n = alphabet.length;
  const limit = 256 - (256 % n);
  let out = "";
  while (out.length < length) {
    const buf = new Uint8Array(length * 2);
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && out.length < length; i++) {
      if (buf[i] < limit) out += alphabet[buf[i] % n];
    }
  }
  return out;
}

function generateKey(format, length, prefix) {
  let body;
  if (format === "uuid") {
    const raw = randomChars(ALPHABETS.hex, length);
    body = raw.match(/.{1,8}/g).join("-");
  } else {
    body = randomChars(ALPHABETS[format], length);
  }
  return prefix + body;
}

function bitsPerChar(format) {
  if (format === "hex" || format === "uuid") return 4;
  if (format === "base64") return 6;
  return Math.log2(62);
}

function strength(bits) {
  if (bits < 64) return { label: "Weak", color: "bg-red-500", pct: 25 };
  if (bits < 96) return { label: "Fair", color: "bg-yellow-500", pct: 50 };
  if (bits < 128) return { label: "Strong", color: "bg-green-500", pct: 75 };
  return { label: "Very strong", color: "bg-emerald-600", pct: 100 };
}

export default function ApiKeyGeneratorClient() {
  const [length, setLength] = useState(32);
  const [format, setFormat] = useState("hex");
  const [prefix, setPrefix] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [keys, setKeys] = useState([]);
  const [copied, setCopied] = useState(null);

  const generate = useCallback(() => {
    const q = Math.min(20, Math.max(1, Number(quantity) || 1));
    const len = Math.min(128, Math.max(16, Number(length) || 16));
    setKeys(Array.from({ length: q }, () => generateKey(format, len, prefix)));
    setCopied(null);
  }, [format, length, prefix, quantity]);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const len = Math.min(128, Math.max(16, Number(length) || 16));
  const bits = Math.floor(len * bitsPerChar(format));
  const s = strength(bits);
  const fieldClass =
    "w-full rounded-md border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          API Key Generator
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-10">
          Generate secure, random API keys in hex, base64, alphanumeric or
          UUID-style formats. Keys are created in your browser with
          crypto.getRandomValues and are never sent anywhere.
        </p>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <label className="block text-sm font-medium">
            Key length: {len}
            <input
              type="range"
              min={16}
              max={128}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full mt-2"
            />
            <span className="block text-xs font-normal text-neutral-500 mt-1">
              Characters of random data (prefix and dashes not counted).
            </span>
          </label>
          <label className="block text-sm font-medium">
            Format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={`${fieldClass} mt-2`}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Prefix (optional)
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="sk_live_"
              className={`${fieldClass} mt-2`}
            />
          </label>
          <label className="block text-sm font-medium">
            Quantity (1–20)
            <input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`${fieldClass} mt-2`}
            />
          </label>
        </section>

        <div className="flex gap-3 mb-8">
          <Button onClick={generate}>Generate</Button>
          <Button
            variant="outline"
            onClick={() => copy(keys.join("\n"), "all")}
            disabled={keys.length === 0}
          >
            {copied === "all" ? "Copied!" : "Copy all"}
          </Button>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Strength</h2>
          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            {s.label}: about {bits} bits of entropy ({len} characters at{" "}
            {bitsPerChar(format).toFixed(2)} bits each).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-3">Generated keys</h2>
          <ul className="space-y-2">
            {keys.map((k, i) => (
              <li
                key={`${i}-${k}`}
                className="flex items-center gap-3 rounded-md border border-gray-200 dark:border-neutral-800 p-3"
              >
                <code className="flex-1 break-all text-sm font-mono">{k}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(k, i)}
                >
                  {copied === i ? "Copied!" : "Copy"}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-3">How to use it</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Pick a length and format, add a prefix such as sk_live_ if you want
            keys that are easy to recognise, choose how many you need, and press
            Generate. Longer keys carry more entropy; 128 bits or more is a
            common target for secrets. Store keys in a secret manager and avoid
            committing them to source control.
          </p>
        </section>

        <aside className="rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
          <p className="text-neutral-700 dark:text-neutral-300">
            Building your own AI-powered product? Castle.ai is a free, open-source
            template you can fork, and it includes user authentication with
            Login and Register flows.
          </p>
          <Link
            href="/"
            className="inline-block mt-3 text-sm font-semibold underline"
          >
            Explore Castle.ai
          </Link>
        </aside>
      </main>
    </div>
  );
}
