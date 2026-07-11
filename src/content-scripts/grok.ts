import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // Grok: messages in chat container
  const chatContainer = document.querySelector('[class*="chat"], [class*="conversation"], [class*="messages"], main');
  
  if (chatContainer) {
    // Look for message blocks
    const messages = chatContainer.querySelectorAll<HTMLElement>(
      '[class*="message"], [class*="turn"], [class*="row"]'
    );

    messages.forEach((msg) => {
      const isUser =
        msg.matches('[class*="user"], [class*="human"]') ||
        msg.querySelector('[class*="user"], [class*="human"]') !== null ||
        msg.getAttribute("data-role") === "user";

      const label = isUser ? "You" : "Grok";
      const textEl = msg.querySelector('[class*="text"], [class*="content"], [class*="body"]');
      let text = textEl ? (textEl as HTMLElement).innerText || (textEl as HTMLElement).textContent || "" : msg.innerText || msg.textContent || "";
      text = text.trim();

      if (text && text.length > 5) {
        parts.push(`## ${label}\n${text}`);
      }
    });
  }

  // Fallback: get content from main area
  if (parts.length === 0) {
    const main = document.querySelector("main");
    if (main) {
      const text = main.innerText?.trim();
      if (text) parts.push(`## Conversation\n${text}`);
    }
  }

  return parts.join("\n\n");
}

initRelay(['textarea', '[contenteditable="true"]'], captureConversation);
