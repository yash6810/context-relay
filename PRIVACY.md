# Privacy Policy

**Context Relay** — Last updated: July 2026

## Summary

Context Relay is a privacy-first browser extension. It captures conversation data from AI chat platforms only when you explicitly request it, stores everything locally on your device, and only sends data to a backend service if you have configured one for primer generation.

## Data Collection

### What We Collect
- **Project context:** Data you enter into project fields (name, task, decisions, links, notes)
- **Captured conversations:** Chat text you explicitly choose to capture by clicking "Capture this conversation"
- **Generated primers:** Structured summaries created from your project data or captured conversations

All of the above is stored locally in `chrome.storage.local` on your device.

### What We Do NOT Collect
- ❌ Browsing history or unrelated tabs
- ❌ Keystrokes or typing data outside capture flows
- ❌ Personal identifiable information
- ❌ Telemetry, analytics, or usage statistics
- ❌ Authentication credentials or session data
- ❌ File attachments, images, or code from conversations

## Data Storage

All data is stored **locally** on your device using `chrome.storage.local`. This data remains on your device unless you explicitly take action to export, share, or back it up.

## Data Transmission

Data is only transmitted off your device in the following scenarios:

### Primer Generation (Optional)
If you configure a primer generation backend (FastAPI or Supabase Edge Function), captured conversation text and project metadata are sent to that endpoint when you click "Generate Primer." The data is processed and the resulting primer is returned.

**You control the backend.** We do not operate a hosted service — you deploy and manage your own backend instance. No data is sent to servers we control.

### Cross-Platform Migration
When you migrate a primer to another AI platform, the primer text is injected into the destination platform's chat input within your browser. This is a local DOM manipulation — the data is not sent to any intermediate server.

## Third-Party Services

### Fireworks AI
If you use the primer generation backend with Fireworks AI (default configuration), conversation data is sent to Fireworks AI's API for processing by the GPT-OSS 120B model. Review [Fireworks AI's Privacy Policy](https://fireworks.ai/privacy) for their data handling practices.

### Supabase
If you use the Supabase Edge Function backend, data passes through Supabase's infrastructure. Review [Supabase's Privacy Policy](https://supabase.com/privacy) for their data handling practices.

## Data Portability

You can export all your data at any time:

- **Individual primers:** Click **Export** on any primer card (Markdown or JSON)
- **Bulk export:** On the History page, click **Export All**
- **Manual export:** All data is in `chrome.storage.local` — accessible via Chrome DevTools → Application → Storage

## Data Deletion

To delete all data:
1. Go to `chrome://extensions`
2. Find Context Relay
3. Click **Details**
4. Click **Clear storage** (under "Inspection views")
5. Alternatively, uninstall the extension — this removes all stored data

Individual projects and primers can be deleted from within the extension.

## Permissions Justification

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Save projects and primers locally |
| `tabs` | Open destination AI platforms for migration |
| `sidePanel` | Open the side panel |
| Host permissions (chatgpt.com, claude.ai, etc.) | Inject relay buttons and capture conversations |

## Changes to This Policy

If this policy changes, the updated version will be posted in the repository. Continued use after changes constitutes acceptance of the new policy.

## Contact

For privacy concerns, open an issue on the [GitHub repository](https://github.com/YOUR_USERNAME/context-relay).