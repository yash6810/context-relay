import { initRelay } from "./shared";

function captureConversation(): string {
  // 1. If the user highlighted specific text, ONLY capture that!
  const selection = window.getSelection()?.toString().trim();
  if (selection && selection.length > 10) {
    return `## Selected Context\n${selection}`;
  }

  const parts: string[] = [];

  // Query both message types together — querySelectorAll preserves document
  // order, so this naturally interleaves user/assistant messages correctly.
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(
    '[data-testid="user-message"], [class*="font-claude-response-body"]'
  ));

  // 2. Only take the last 6 messages (approx 3 recent turns) to avoid grabbing
  // old "bullshit" from the top of a very long chat thread.
  const recentNodes = nodes.slice(-6);

  recentNodes.forEach((node) => {
    const isUser = node.matches('[data-testid="user-message"]');
    const label = isUser ? "You" : "Claude";
    const text = (node.innerText || node.textContent || "").trim();
    if (text && text.length > 5) {
      parts.push(`## ${label}\n${text}`);
    }
  });

  return parts.join("\n\n");
}

initRelay(['[contenteditable="true"]'], captureConversation);
