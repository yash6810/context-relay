# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability in Context Relay, please report it privately.

**Do not open a public GitHub issue for security vulnerabilities.**

Send details to the repository maintainers via a [GitHub Security Advisory](https://github.com/YOUR_USERNAME/context-relay/security/advisories/new) or email the project maintainers directly.

Please include:
- A description of the vulnerability
- Steps to reproduce
- Affected versions
- Any potential impact

You should receive a response within 48 hours. If the issue is confirmed, a fix will be released as soon as possible.

## Scope

Context Relay is a browser extension that reads content from the DOM of supported AI chat platforms. It does not:

- Collect telemetry or analytics data
- Send data to third parties (except the explicitly configured primer generation backend)
- Access browsing history or unrelated tabs
- Store credentials or personal identifiable information

All captured conversations are stored locally in `chrome.storage.local` and are never transmitted unless you explicitly use the primer generation backend (FastAPI or Supabase Edge Function) which you host yourself.

## Permissions

The extension requests the following permissions:

- `storage` — to save projects and primers locally
- `tabs` — to open destination AI platforms for migration
- `sidePanel` — to open the side panel
- `host_permissions` for each supported AI platform — to inject content scripts

These are the minimum permissions required for the extension to function.