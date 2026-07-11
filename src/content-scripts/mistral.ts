import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // Mistral: look for chat thread containers
  const chatContainer = document.querySelector(
    '[class*="chat"], [class*="conversation"], [class*="messages"], [class*="thread"]'
  );

  if (chatContainer) {
    const messages = chatContainer.querySelectorAll<HTMLElement>(
      '[class*="message"], [class*="turn"], [class*="bubble"]'
    );

    messages.forEach((msg) => {
      const isUser =
        msg.matches('[class*="user"], [class*="human"]') ||
        msg.querySelector('[class*="user"], [class*="human"]') !== null ||
        msg.getAttribute("data-role") === "user";

      const label = isUser ? "You" : "Mistral";
      const textEl = msg.querySelector('[class*="text"], [class*="content"], [class*="body"]');
      let text = textEl ? (textEl as HTMLElement).innerText || (textEl as HTMLElement).textContent || "" : msg.innerText || msg.textContent || "";
      text = text.trim();

      if (text && text.length > 5) {
        parts.push(`## ${label}\n${text}`);
      }
    });
  }

  // Fallback: grab all visible text blocks
  if (parts.length === 0) {
    const main = document.querySelector("main") || document.body;
    const textBlocks = main.querySelectorAll<HTMLElement>("p, [class*=\"prose\"], [class*=\"text\"]");
    const text = Array.from(textBlocks)
      .map(el => el.innerText || el.textContent || "")
      .filter(t => t.trim().length > 10)
      .join("\n\n");
    if (text) parts.push(`## Conversation\n${text}`);
  }

  return parts.join("\n\n");
}

initRelay(['textarea', '[contenteditable="true"]'], captureConversation);
