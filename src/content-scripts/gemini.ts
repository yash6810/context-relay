import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // Gemini: turns are in turn containers
  const turns = document.querySelectorAll<HTMLElement>('[class*="turn"], [class*="conversation-turn"]');

  turns.forEach((turn) => {
    const isUser = turn.matches('[class*="user"], [class*="model-query"]') ||
      turn.querySelector('[class*="user"]') !== null;

    const label = isUser ? "You" : "Gemini";

    // Get text from the turn
    const textEl = turn.querySelector('[class*="text"], [class*="content"], [class*="message"]');
    let text = textEl ? (textEl as HTMLElement).innerText || (textEl as HTMLElement).textContent || "" : turn.innerText || turn.textContent || "";
    text = text.trim();

    if (text && text.length > 5) {
      parts.push(`## ${label}\n${text}`);
    }
  });

  // Fallback: look for role-based attributes
  if (parts.length === 0) {
    const userMessages = document.querySelectorAll<HTMLElement>('[data-role="user"], [data-user="true"]');
    const modelMessages = document.querySelectorAll<HTMLElement>('[data-role="model"], [data-model="true"]');

    userMessages.forEach((el) => {
      const text = el.innerText?.trim();
      if (text) parts.push(`## You\n${text}`);
    });

    modelMessages.forEach((el) => {
      const text = el.innerText?.trim();
      if (text) parts.push(`## Gemini\n${text}`);
    });
  }

  return parts.join("\n\n");
}

initRelay(['[contenteditable="true"]'], captureConversation);
