/**
 * OpenAI Assistants API → Responses API migrator
 *
 * Assistants API concepts:
 *   - client.beta.assistants.create(...)
 *   - client.beta.threads.create()
 *   - client.beta.threads.messages.create(thread_id, ...)
 *   - client.beta.threads.runs.createAndPoll(thread_id, {assistant_id})
 *   - run.status / run.last_error
 *   - client.beta.threads.messages.list(thread_id)
 *
 * Responses API equivalents:
 *   - client.responses.create({ model, input, instructions, tools, previous_response_id })
 *   - response.output / response.output_text
 *   - For multi-turn: store previous_response_id and pass it forward
 */

export type MigrationTarget = 'responses-api' | 'claude-api';

export interface MigrationResult {
  migratedCode: string;
  changesDetected: string[];
  warnings: string[];
  summary: string;
}

// -----------------------------------------------------------------------
// Responses API migration rules
// -----------------------------------------------------------------------

const RESPONSES_REPLACEMENTS: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  // 1. Import: openai → keep (same package, new method)
  [/from ['"]openai['"]/g, "from 'openai'"],

  // 2. Assistant creation → instructions string (keep the instructions content)
  [
    /await\s+client\.beta\.assistants\.create\(\s*\{([^}]*)\}\s*\)/gs,
    (m) => {
      const block = m[1];
      const instrMatch = block.match(/instructions\s*:\s*(['"`])([\s\S]*?)\1/);
      const instrValue = instrMatch ? instrMatch[2] : 'You are a helpful assistant.';
      return `/* MIGRATED: assistant replaced by instructions string */\nconst instructions = "${instrValue.replace(/"/g, '\\"')}"`;
    },
  ],

  // 3. Thread creation → no equivalent needed (handled by previous_response_id)
  [
    /await\s+client\.beta\.threads\.create\(\s*\)/g,
    '/* MIGRATED: threads replaced by previous_response_id chain */ null',
  ],
  [
    /const\s+(\w+)\s*=\s*await\s+client\.beta\.threads\.create\(\s*\)/g,
    (m) => `/* MIGRATED: thread ID no longer needed — use previousResponseId instead */\nlet previousResponseId: string | null = null`,
  ],

  // 4. Add message to thread → becomes part of input array
  [
    /await\s+client\.beta\.threads\.messages\.create\(\s*(\w+)(?:\.id)?\s*,\s*\{([^}]*)\}\s*\)/gs,
    (m) => {
      const block = m[2];
      const contentMatch = block.match(/content\s*:\s*(['"`])([\s\S]*?)\1/);
      const content = contentMatch ? contentMatch[2] : 'USER_MESSAGE';
      return `/* MIGRATED: message now passed as input */\nconst userMessage = "${content.replace(/"/g, '\\"')}"`;
    },
  ],

  // 5. createAndPoll → responses.create
  [
    /await\s+client\.beta\.threads\.runs\.createAndPoll\(\s*(\w+)(?:\.id)?\s*,\s*\{[^}]*\}\s*\)/gs,
    (m) => {
      return `await client.responses.create({\n  model: "gpt-4o", // adjust as needed\n  input: userMessage,\n  instructions,\n  ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),\n})`;
    },
  ],

  // 6. run.status checks → response is synchronous (no polling needed)
  [/if\s*\(\s*\w+\.status\s*===\s*['"]completed['"]\s*\)/g, '/* MIGRATED: Responses API is synchronous — no status check needed */\nif (true)'],
  [/\w+\.status/g, '/* response status removed — synchronous */ "completed"'],

  // 7. Read messages from thread → response.output_text
  [
    /await\s+client\.beta\.threads\.messages\.list\(\s*\w+(?:\.id)?\s*\)/g,
    '/* MIGRATED: use response.output_text instead */',
  ],

  // 8. assistant_id reference → no longer needed
  [/assistant_id\s*:\s*\w+(?:\.id)?/g, '/* assistant_id removed — use instructions instead */'],

  // 9. Store response ID for next turn
  [
    /const\s+(\w+)\s*=\s*await\s+client\.responses\.create\(/g,
    (m) => {
      return `const response = await client.responses.create(`;
    },
  ],
];

// -----------------------------------------------------------------------
// Claude API migration rules (bonus target)
// -----------------------------------------------------------------------

const CLAUDE_REPLACEMENTS: [RegExp, string][] = [
  // Import swap
  [/from ['"]openai['"]/g, "from '@anthropic-ai/sdk'"],
  [/new OpenAI\(/g, 'new Anthropic('],
  [/OpenAI\b/g, 'Anthropic'],

  // Model names
  [/gpt-4o-mini/g, 'claude-haiku-4-5-20251001'],
  [/gpt-4o/g, 'claude-sonnet-4-6'],
  [/gpt-4-turbo/g, 'claude-opus-4-6'],
  [/gpt-3\.5-turbo/g, 'claude-haiku-4-5-20251001'],

  // Assistants API → messages.create
  [
    /await\s+client\.beta\.assistants\.create\([^)]*\)/gs,
    '/* MIGRATED to Claude: use system prompt in messages.create */',
  ],
  [/await\s+client\.beta\.threads\.\w+[^;]*/gs, '/* MIGRATED: no threads in Claude API */'],

  // Chat completions → messages.create
  [/client\.chat\.completions\.create/g, 'client.messages.create'],
  [/completion\.choices\[0\]\.message\.content/g, 'message.content[0].text'],
  [/response\.choices\[0\]\.message\.content/g, 'response.content[0].text'],
];

// -----------------------------------------------------------------------
// Change detection
// -----------------------------------------------------------------------

const CHANGE_DESCRIPTORS: [RegExp, string][] = [
  [/client\.beta\.assistants\.create/g, 'Assistant creation → instructions string'],
  [/client\.beta\.threads\.create/g, 'Thread creation → previous_response_id chain'],
  [/client\.beta\.threads\.messages\.create/g, 'Thread message → input parameter'],
  [/client\.beta\.threads\.runs\.createAndPoll/g, 'createAndPoll → responses.create (synchronous)'],
  [/client\.beta\.threads\.messages\.list/g, 'Message listing → response.output_text'],
  [/\.status\s*===\s*['"]completed['"]/g, 'Status polling removed (synchronous API)'],
  [/file_search/g, 'file_search tool detected — verify vector store migration'],
  [/code_interpreter/g, 'code_interpreter detected — check Responses API tool support'],
];

const WARNINGS_MAP: [RegExp, string][] = [
  [/file_search/g, 'file_search: Vector stores still work but the API param changed. Verify your vector_store_ids are passed under tools[].file_search.vector_store_ids.'],
  [/code_interpreter/g, 'code_interpreter: Still supported in Responses API. Confirm tool schema matches new format.'],
  [/assistant_id/g, 'assistant_id: Assistants are deprecated. Your assistant config (model, instructions, tools) moves into the responses.create() call directly.'],
  [/thread\.id|threadId/g, 'Thread IDs: Replace with previous_response_id. Store response.id after each turn and pass it as previous_response_id next turn.'],
];

// -----------------------------------------------------------------------
// Main entry point
// -----------------------------------------------------------------------

export function migrateCode(code: string, target: MigrationTarget): MigrationResult {
  const changesDetected: string[] = [];
  const warnings: string[] = [];

  // Detect changes before transformation
  for (const [pattern, description] of CHANGE_DESCRIPTORS) {
    if (pattern.test(code)) {
      changesDetected.push(description);
      pattern.lastIndex = 0;
    }
  }

  // Detect warnings
  for (const [pattern, warning] of WARNINGS_MAP) {
    if (pattern.test(code)) {
      warnings.push(warning);
      pattern.lastIndex = 0;
    }
  }

  let migratedCode = code;

  if (target === 'responses-api') {
    for (const [pattern, replacement] of RESPONSES_REPLACEMENTS) {
      if (typeof replacement === 'function') {
        migratedCode = migratedCode.replace(pattern as RegExp, (...args) =>
          (replacement as (m: RegExpMatchArray) => string)(args as unknown as RegExpMatchArray)
        );
      } else {
        migratedCode = migratedCode.replace(pattern, replacement);
      }
    }

    // Add post_migration_note header
    const header = `// ============================================================
// MIGRATED: OpenAI Assistants API → Responses API
// Generated by openai-migration-tool
// Review all /* MIGRATED */ comments before deploying
// Docs: https://platform.openai.com/docs/guides/responses-vs-chat-completions
// ============================================================\n\n`;
    migratedCode = header + migratedCode;
  } else {
    for (const [pattern, replacement] of CLAUDE_REPLACEMENTS) {
      migratedCode = migratedCode.replace(pattern, replacement);
    }

    const header = `// ============================================================
// MIGRATED: OpenAI Assistants API → Anthropic Claude API
// Generated by openai-migration-tool
// Docs: https://docs.anthropic.com/en/api/messages
// ============================================================\n\n`;
    migratedCode = header + migratedCode;
  }

  const summary =
    changesDetected.length > 0
      ? `Detected ${changesDetected.length} migration point(s). ${warnings.length > 0 ? `${warnings.length} item(s) need manual review.` : 'No manual review required.'}`
      : 'No Assistants API usage detected. Code may already be compatible.';

  return { migratedCode, changesDetected, warnings, summary };
}
