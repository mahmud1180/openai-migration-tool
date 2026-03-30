'use client';

import { useState } from 'react';

const SAMPLE_CODE = `import OpenAI from 'openai';

const client = new OpenAI();

// Create an assistant
const assistant = await client.beta.assistants.create({
  name: "My Assistant",
  instructions: "You are a helpful coding assistant.",
  model: "gpt-4o",
  tools: [{ type: "code_interpreter" }],
});

// Create a thread
const thread = await client.beta.threads.create();

// Add a message
await client.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "Help me debug this function.",
});

// Run and poll
const run = await client.beta.threads.runs.createAndPoll(thread.id, {
  assistant_id: assistant.id,
});

if (run.status === 'completed') {
  const messages = await client.beta.threads.messages.list(thread.id);
  console.log(messages.data[0].content);
}`;

type Target = 'responses-api' | 'claude-api';

interface MigrationResult {
  migratedCode: string;
  changesDetected: string[];
  warnings: string[];
  summary: string;
}

export default function Home() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [target, setTarget] = useState<Target>('responses-api');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleMigrate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, target }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.migratedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">
            OpenAI Assistants API Migration Tool
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Assistants API sunsets August 26, 2026 · Migrate to Responses API or Claude API
          </p>
        </div>
        <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-1 rounded">
          149 days left
        </span>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Target selector */}
        <div className="flex gap-3 mb-4">
          <span className="text-xs text-gray-400 self-center">Migrate to:</span>
          <button
            onClick={() => setTarget('responses-api')}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              target === 'responses-api'
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            OpenAI Responses API (recommended)
          </button>
          <button
            onClick={() => setTarget('claude-api')}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              target === 'claude-api'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                : 'border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            Anthropic Claude API
          </button>
        </div>

        {/* Editor panels */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Original code (Assistants API)</span>
              <button
                onClick={() => setCode(SAMPLE_CODE)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Load example
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 bg-gray-900 border border-gray-700 rounded p-3 text-xs text-gray-200 resize-none focus:outline-none focus:border-gray-500 font-mono"
              placeholder="Paste your Assistants API code here..."
              spellCheck={false}
            />
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Migrated code</span>
              {result && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className="w-full h-96 bg-gray-900 border border-gray-700 rounded p-3 text-xs overflow-auto">
              {loading ? (
                <div className="text-gray-500 animate-pulse">Migrating...</div>
              ) : result ? (
                <pre className="text-gray-200 whitespace-pre-wrap">{result.migratedCode}</pre>
              ) : (
                <div className="text-gray-600">Migrated code will appear here</div>
              )}
            </div>
          </div>
        </div>

        {/* Migrate button */}
        <button
          onClick={handleMigrate}
          disabled={loading || !code.trim()}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded transition-colors"
        >
          {loading ? 'Migrating...' : 'Migrate Code →'}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Changes detected */}
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <h3 className="text-xs font-semibold text-gray-300 mb-3">Changes Applied</h3>
              {result.changesDetected.length === 0 ? (
                <p className="text-xs text-gray-500">No Assistants API usage found</p>
              ) : (
                <ul className="space-y-1.5">
                  {result.changesDetected.map((change, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-300">{change}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Warnings */}
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <h3 className="text-xs font-semibold text-gray-300 mb-3">Manual Review Required</h3>
              {result.warnings.length === 0 ? (
                <p className="text-xs text-green-400">No manual review needed ✓</p>
              ) : (
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="text-yellow-400 mt-0.5">⚠</span>
                      <span className="text-gray-300">{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Summary bar */}
            <div className="col-span-2 bg-blue-900/20 border border-blue-700/30 rounded p-3">
              <p className="text-xs text-blue-300">{result.summary}</p>
            </div>
          </div>
        )}

        {/* Footer / CTA */}
        <div className="mt-8 border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-500 mb-3">
            Migrate multiple files or entire codebases?
          </p>
          <a
            href="https://gumroad.com"
            className="inline-block text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded transition-colors"
          >
            Get the CLI tool — $49 one-time →
          </a>
        </div>
      </div>
    </main>
  );
}
