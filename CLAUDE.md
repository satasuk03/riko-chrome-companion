# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Companion is a Manifest V3 Chrome Extension that displays a draggable pixel-art anime companion character ("Riko") on every webpage. It features speech bubbles with typewriter animation, a chat panel with LLM integration (OpenAI, Anthropic, Gemini), and position persistence. The entire UI lives inside a closed Shadow DOM for CSS isolation.

## Build Commands

```bash
npm run build    # Bundle content script + service worker via esbuild → dist/
npm run dev      # Build once, then watch both entry points for changes
npm run clean    # Remove dist/
```

There are no tests, linting, or type checking configured. The project uses plain JavaScript with no framework or external runtime dependencies — only esbuild as a dev dependency.

After building, load the extension in Chrome via `chrome://extensions` → "Load unpacked" pointing to the project root. The `dist/` folder contains the bundled output; `manifest.json` references `dist/content.js` and `dist/background.js`.

## Architecture

**Two entry points bundled by esbuild:**
- `src/content.js` → `dist/content.js` (content script, runs on every page)
- `src/background/service-worker.js` → `dist/background.js` (background service worker)

**Content script modules** (`src/`): Each module exports an `init()` function that receives dependencies via parameter objects to avoid circular imports. `content.js` bootstraps a closed Shadow DOM host element and initializes all modules: emotions, bubble, chat, drag, storage, messages.

**Background service worker** (`src/background/`): Handles LLM API routing. `llm.js` routes to provider adapters in `src/background/providers/` — each provider implements the same `chat(apiKey, model, messages, systemPrompt)` interface.

**Settings UI** (`options/`): Standalone HTML/JS/CSS for the extension options page (provider selection, model, API key, system prompt). Not bundled by esbuild — loaded directly by Chrome.

**Communication:** Content script ↔ Service worker via `chrome.runtime.sendMessage` / `onMessage`. Message types include `CHAT_REQUEST`, `TEST_CONNECTION`, `OPEN_SETTINGS`, `OPEN_HELP`, `SET_EMOTION`, `SET_BUBBLE_TEXT_ANIMATED`.

**Storage:** `chrome.storage.local` for both position persistence and user settings (provider, model, API key, system prompt).

**Constants:** `src/constants.js` centralizes emotion maps, storage keys, provider configs, system prompts, and timing intervals. This is the single source of truth for shared configuration.

## Key Conventions

- Retro pixel-art visual theme: brown borders, beige backgrounds, monospace fonts, pixelated rendering
- All Shadow DOM styles live in `src/styles.js` as a template literal
- Sprite assets are in `assets/` as `.webp` files, referenced via `chrome.runtime.getURL()`
- The companion auto re-injects via MutationObserver if removed (SPA resilience)
- Drag uses pointer events with `setPointerCapture` for reliable cross-browser behavior
