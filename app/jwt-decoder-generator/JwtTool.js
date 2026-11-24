"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALGS = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" };
const enc = new TextEncoder();

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function bytesToB64url(bytes) {
  let bin = "";
  new Uint8Array(bytes).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function strToB64url(str) {
  return bytesToB64url(enc.encode(str));
}
function decodePart(part) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
}
async function hmac(alg, secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: ALGS[alg] },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}
function fmtDate(sec) {
  return typeof sec === "number" ? new Date(sec * 1000).toUTCString() : String(sec);
}

const SAMPLE_PAYLOAD = '{\n  "sub": "1234567890",\n  "name": "Test User"\n}';

export default function JwtTool() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [token, setToken] = useState("");
  const [verifySecret, setVerifySecret] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [decodeError, setDecodeError] = useState("");
  const [sigStatus, setSigStatus] = useState("");

  const [payload, setPayload] = useState(SAMPLE_PAYLOAD);
  const [secret, setSecret] = useState("");
  const [alg, setAlg] = useState("HS256");
  const [expiry, setExpiry] = useState("3600");
  const [generated, setGenerated] = useState("");
  const [genError, setGenError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const t = token.trim();
      if (!t) {
        setDecoded(null);
        setDecodeError("");
        setSigStatus("");
        return;
      }
      const parts = t.split(".");
      if (parts.length !== 3) {
        setDecoded(null);
        setDecodeError("A JWT has three dot-separated parts.");
        setSigStatus("");
        return;
      }
      try {
        const header = decodePart(parts[0]);
        const body = decodePart(parts[1]);
        if (cancelled) return;
        setDecoded({ header, body });
        setDecodeError("");
        if (!verifySecret) {
          setSigStatus("Enter the secret to check the signature (HS256/384/512 only).");
        } else if (!ALGS[header.alg]) {
          setSigStatus(`Signature check is not supported for ${header.alg}.`);
        } else {
          const sig = bytesToB64url(await hmac(header.alg, verifySecret, `${parts[0]}.${parts[1]}`));
          if (!cancelled) setSigStatus(sig === parts[2] ? "valid" : "invalid");
        }
      } catch {
        if (!cancelled) {
          setDecoded(null);
          setDecodeError("Could not decode this token. Check that it is a valid JWT.");
          setSigStatus("");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, verifySecret]);

  async function generate() {
    setGenError("");
    setGenerated("");
    try {
      const body = JSON.parse(payload);
      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new Error("Payload must be a JSON object.");
      }
      if (!secret) throw new Error("Enter a secret.");
      const now = Math.floor(Date.now() / 1000);
      body.iat = now;
      const secs = Number(expiry);
      if (expiry !== "" && secs > 0) body.exp = now + Math.floor(secs);
      const h = strToB64url(JSON.stringify({ alg, typ: "JWT" }));
      const p = strToB64url(JSON.stringify(body));
      const sig = bytesToB64url(await hmac(alg, secret, `${h}.${p}`));
      setGenerated(`${h}.${p}.${sig}`);
    } catch (e) {
      setGenError(e.message || "Could not generate token.");
    }
  }

  const expired =
    decoded && typeof decoded.body.exp === "number" && decoded.body.exp * 1000 < Date.now();

  const box =
    "w-full rounded-lg border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-3 text-sm font-mono";
  const pre =
    "rounded-lg border border-gray-200 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950 p-3 text-xs font-mono overflow-x-auto";

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          <span>🔮</span>
          <span>Castle.ai</span>
        </Link>
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-9 h-9"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        )}
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <header>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">JWT Decoder & Generator</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Paste a JWT to decode its header and payload, or fill in claims to generate a signed token for testing.
            Everything runs in your browser using Web Crypto; nothing is sent anywhere.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Decode a JWT</h2>
          <label className="block text-sm font-medium" htmlFor="jwt-in">Encoded JWT</label>
          <textarea
            id="jwt-in"
            className={box}
            rows={5}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOi..."
          />
          {decodeError && <p className="text-sm text-red-600 dark:text-red-400">{decodeError}</p>}
          {decoded && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Header</h3>
                <pre className={pre}>{JSON.stringify(decoded.header, null, 2)}</pre>
              </div>
              <div>
                <h3 className="font-medium mb-1">Payload</h3>
                <pre className={pre}>{JSON.stringify(decoded.body, null, 2)}</pre>
              </div>
              <ul className="text-sm space-y-1">
                {["iat", "nbf", "exp"].map(
                  (k) =>
                    decoded.body[k] !== undefined && (
                      <li key={k}>
                        <code>{k}</code>: {fmtDate(decoded.body[k])}
                        {k === "exp" && expired && (
                          <span className="ml-2 font-semibold text-red-600 dark:text-red-400">Expired</span>
                        )}
                      </li>
                    )
                )}
              </ul>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="jwt-secret">
                  Secret (to check the signature)
                </label>
                <input
                  id="jwt-secret"
                  className={box}
                  value={verifySecret}
                  onChange={(e) => setVerifySecret(e.target.value)}
                />
                <p className="mt-2 text-sm" aria-live="polite">
                  {sigStatus === "valid" ? (
                    <span className="font-semibold text-green-600 dark:text-green-400">Signature valid</span>
                  ) : sigStatus === "invalid" ? (
                    <span className="font-semibold text-red-600 dark:text-red-400">Signature invalid</span>
                  ) : (
                    sigStatus
                  )}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">JWT Generator</h2>
          <label className="block text-sm font-medium" htmlFor="gen-payload">Payload JSON</label>
          <textarea id="gen-payload" className={box} rows={6} value={payload} onChange={(e) => setPayload(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="gen-secret">Secret</label>
              <input id="gen-secret" className={box} value={secret} onChange={(e) => setSecret(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="gen-alg">Algorithm</label>
              <select id="gen-alg" className={box} value={alg} onChange={(e) => setAlg(e.target.value)}>
                {Object.keys(ALGS).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="gen-exp">Expires in (seconds)</label>
              <input id="gen-exp" type="number" min="0" className={box} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
          </div>
          <Button onClick={generate}>Generate token</Button>
          {genError && <p className="text-sm text-red-600 dark:text-red-400">{genError}</p>}
          {generated && (
            <div>
              <h3 className="font-medium mb-1">Signed JWT</h3>
              <pre className={`${pre} whitespace-pre-wrap break-all`}>{generated}</pre>
            </div>
          )}
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Generation and signature checks support HS256, HS384 and HS512. Tokens signed with public/private keys
            (RS256, ES256) can be decoded but not verified here. Use test secrets only, not production keys.
          </p>
        </section>

        <aside className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6">
          <p className="font-medium">
            Castle.ai is a free, open-source template with user authentication (Login and Register flows) — fork it as a starting point.
          </p>
          <Link href="/" className="inline-block mt-2 text-sm underline">
            See Castle.ai
          </Link>
        </aside>
      </main>
    </div>
  );
}
