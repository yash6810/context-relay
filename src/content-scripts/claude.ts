import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // Query both message types together — querySelectorAll preserves document
  // order, so this naturally interleaves user/assistant messages correctly.
  const nodes = document.querySelectorAll<HTMLElement>(
    '[data-testid="user-message"], [class*="font-claude-response-body"]'
  );

  nodes.forEach((node) => {
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
