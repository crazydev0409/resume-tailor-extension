# AI Resume Tailor — Chrome Extension

A Chrome extension that lets you tailor your resume for any job description directly from your browser. Select text on any job posting, right-click (or use a keyboard shortcut), and get an ATS-optimized resume in seconds.

## Features

- **Right-Click to Tailor**: Select a job description on any page, right-click, and choose "Tailor My Resume"
- **Keyboard Shortcut**: `Alt+Shift+T` (Windows/Linux) or `Ctrl+Shift+T` (Mac) to tailor from selected text instantly
- **Background Processing**: Tailoring runs in the background service worker — close the popup and come back when it's done
- **Notification Alerts**: Optional native notifications when tailoring starts and completes
- **PDF Export**: Download tailored resumes as professionally formatted PDFs with multiple color themes and templates
- **Bulk Download**: Download all resumes or job descriptions individually as PDFs
- **History Management**: Pin, annotate, and manage your tailored resume history
- **Dark Mode**: Toggle between light and dark themes
- **ATS Optimization**: Targets 95+ ATS score with keyword alignment, bold formatting, and structured sections

## Architecture

```
Background Script (service worker)     Popup (display layer)
┌─────────────────────────────────┐    ┌───────────────────────────┐
│  Owns ALL state & storage       │    │  Pure read-only UI        │
│  ─ Tailoring (API calls)        │    │  ─ Reads via GET_STATE    │
│  ─ Working/Done list management │◄──►│  ─ Live via storage.onChanged │
│  ─ Keepalive alarms (MV3)       │    │  ─ Sends commands only    │
│  ─ Notifications                │    │  ─ PDF generation/download│
│  ─ Stale item recovery          │    │                           │
└─────────────────────────────────┘    └───────────────────────────┘
```

- **Background script** handles all business logic: API calls, storage writes, list mutations, badge updates, and notifications.
- **Popup** is a thin display layer: reads state, shows status, sends commands, and handles PDF downloads.
- **chrome.alarms** keepalive prevents MV3 service worker termination during long API calls.
- **chrome.storage.onChanged** keeps the popup in sync — no polling, no broadcast dependency.

## How It Works

1. **Set Up**: Open the extension popup, go to Settings, and enter your API key, API URL, model, and base resume (in Markdown).
2. **Tailor**: Select a job description on any page and either:
   - Right-click → "Tailor My Resume"
   - Press `Alt+Shift+T` (or `Ctrl+Shift+T` on Mac)
   - Open the popup and paste a JD manually via the "Tailor" button
3. **Wait**: The background processes the request (typically 1–2 minutes). A badge shows active tailoring count. You'll get a notification when it's done.
4. **Download**: Open the popup to view, preview, and download your tailored resume as a PDF.

## Installation

### From Source

```sh
# Navigate to the extension directory
cd resume-ai-tailor-chrome-extension

# Install dependencies
npm install

# Build for production
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder inside `resume-ai-tailor-chrome-extension`
5. The extension icon appears in your toolbar

### Customize Keyboard Shortcut

1. Go to `chrome://extensions/shortcuts`
2. Find "AI Resume Tailor" → "Tailor resume from selected text"
3. Set your preferred shortcut

## Configuration

### API Settings (in extension popup → Settings)

| Setting | Description | Default |
|---------|-------------|---------|
| API Key | Your OpenAI-compatible API key | — |
| API URL | Base URL for the API provider | `https://api.deepseek.com` |
| Model | Model to use for tailoring | `deepseek-v4-pro` |
| Base Resume | Your resume in Markdown format | — |

### Notification Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Notify on Start | Show notification when a new JD is accepted | On |
| Notify on Complete | Show notification when tailoring finishes | On |

### Supported API Providers

Any OpenAI-compatible API works — the extension sends requests through a proxy server:

- OpenAI (`https://api.openai.com/v1`)
- DeepSeek (`https://api.deepseek.com`)
- Any provider with a compatible `/chat/completions` endpoint

## Project Structure

```
src/
├── background.ts           # Service worker: tailoring, state, alarms
├── content.ts              # Content script (selection helper)
├── popup.tsx               # Popup entry point
├── PopupApp.tsx            # Main popup component (display layer)
├── components/
│   ├── ext/                # Extension-specific components
│   │   ├── DoneList.tsx    # Completed resumes list + downloads
│   │   ├── WorkingList.tsx # In-progress / failed items
│   │   ├── TailorView.tsx  # Manual JD input form
│   │   ├── SettingsView.tsx# API & notification settings
│   │   └── ResumeDetailView.tsx # Single resume preview + actions
│   └── ui/                 # shadcn/ui components
├── hooks/
│   └── useChromeStorage.ts # chrome.storage ↔ React state hook
├── services/
│   ├── openai.ts           # API call logic (shared with React app)
│   └── pdfGenerator.ts     # PDF generation with jsPDF
├── types/
│   └── extension.ts        # WorkingItem, DoneItem interfaces
└── utils/
    └── keywordExtractor.ts # Keyword analysis utilities
```

## Tech Stack

- **Extension**: Chrome Manifest V3
- **UI**: React 18 + TypeScript
- **Build**: Vite
- **Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **PDF**: jsPDF
- **State**: chrome.storage.local (background-owned)
- **Keepalive**: chrome.alarms API

## Permissions

| Permission | Why |
|------------|-----|
| `contextMenus` | Right-click "Tailor My Resume" |
| `storage` | Persist settings, working/done lists |
| `activeTab` | Read selected text on the current tab |
| `notifications` | Show start/complete alerts |
| `scripting` | Inject script to grab selected text (keyboard shortcut) |
| `alarms` | Keep service worker alive during API calls |

## Privacy

- **No data collection**: Everything stays in your browser's local storage.
- **API key**: Stored locally in `chrome.storage.local`, sent only to your configured API provider via the proxy.
- **No analytics, no telemetry, no tracking.**

## Related Projects

- [`resume-ai-tailor-78-app`](../resume-ai-tailor-78-app/) — Full React web app version
- [`resume-ai-tailor-78-api`](../resume-ai-tailor-78-api/) — Express proxy server for API requests

## License

This project is open source and available under the [MIT License](LICENSE).
