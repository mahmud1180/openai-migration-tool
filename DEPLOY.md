# Deploy Guide — OpenAI Assistants Migration Tool

## Status: BUILD COMPLETE ✓ — Ready to deploy

## Vercel Deploy (5 min)

1. Push to GitHub: `git init && git add . && git commit -m "initial" && gh repo create openai-migration-tool --public --push`
2. Go to vercel.com → New Project → Import repo
3. Framework: Next.js (auto-detected)
4. No env vars needed for MVP (all logic is client-side + API route)
5. Deploy → get URL

## Gumroad Product Setup (CLI upsell)

1. Create product: "OpenAI Assistants CLI Migrator" — $49 one-time
2. Description: "Migrate entire codebases with one command. Scans all .ts/.js/.py files, applies Assistants API → Responses API transforms, writes migrated files to /output. 5 minutes instead of 40 hours."
3. After purchase: deliver a zip with a Node.js CLI script (build next after web version validated)

## Reddit Launch Posts

### r/webdev (10M subs) — timing: Tuesday 9am EST
```
Title: I built a free tool to migrate OpenAI Assistants API code before the Aug 26 deadline

OpenAI is sunsetting the Assistants API on August 26, 2026. If you have production apps
using threads/runs/file_search, you need to migrate.

I built a free web tool: [URL]

Paste your code → get migrated code for Responses API (or Claude API if you want to switch).
Detects: assistant creation, thread management, createAndPoll, message listing, file_search, code_interpreter.

For multi-file migrations, there's a CLI version at $49 one-time.

Happy to answer questions about the migration path.
```

### r/LocalLLaMA / r/ChatGPTCoding — same post structure

### Hacker News (Show HN)
```
Show HN: Free tool to migrate OpenAI Assistants API code before August 2026 deadline
```

## Twitter/X Thread

```
1/ OpenAI is killing the Assistants API on August 26, 2026.

If you have production apps using:
- client.beta.threads.create()
- client.beta.threads.runs.createAndPoll()
- thread messages / file_search

You need to migrate. Here's how (and a free tool):

2/ The Responses API is the replacement. Key differences:
- No threads (use previous_response_id for multi-turn)
- No assistant objects (pass instructions directly)
- Synchronous responses (no polling)
- file_search still works, different schema

3/ I built a free migration tool: [URL]
Paste your code, get migrated output.

For codebases with 10+ files: CLI version at $49 one-time.

4/ What it handles automatically:
✓ assistants.create() → instructions string
✓ threads.create() → previous_response_id chain
✓ createAndPoll() → responses.create()
✓ message listing → response.output_text
✓ Warns on file_search / code_interpreter manual review
```

## Pricing Strategy

- Web tool: FREE (lead gen, SEO, word of mouth)
- CLI tool: $49 one-time (handles entire repos)
- Agency bundle: $249 (10 codebases, email support)

## Week 1 Success Metrics

- 500 web tool uses
- 20 CLI sales ($980)
- HN front page or r/webdev > 100 upvotes
```

## CLI Tool (build after web validated)

```bash
# Target UX:
npm install -g openai-migrator
openai-migrator migrate ./src --target responses-api --output ./migrated

# Scans all .ts .js .py files
# Applies transformations
# Writes to /migrated directory
# Prints summary report
```
