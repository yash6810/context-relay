import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // Claude: messages are in <article> elements, user/assistant distinguished by classes or data attributes
  const articles = document.querySelectorAll<HTMLElement>("article");

  articles.forEach((article) => {
    // Determine role from data attribute or class
    const isUser =
      article.querySelector('[class*="user"]') !== null ||
      article.getAttribute("data-role") === "user";

    const label = isUser ? "You" : "Claude";

    // Look for text content in common Claude message containers
    const textEl = article.querySelector('[class*="font-claude-message"], .prose, [class*="message-content"]');
    let text = textEl ? (textEl as HTMLElement).innerText || (textEl as HTMLElement).textContent || "" : article.innerText || article.textContent || "";
    text = text.trim();

    if (text && text.length > 5) {
      parts.push(`## ${label}\n${text}`);
    }
  });

  // If no articles found, try alternative: look for div with specific attributes
  if (parts.length === 0) {
    const chatContainer = document.querySelector('[class*="conversation"], [class*="chat"]');
    if (chatContainer) {
      const blocks = chatContainer.querySelectorAll<HTMLElement>("[class*=\"message\"], [class*=\"turn\"]");
      blocks.forEach((block) => {
        const isUser = block.classList.contains("user") || block.querySelector('[class*="user"]') !== null;
        const text = (block as HTMLElement).innerText?.trim();
        if (text && text.length > 5) {
          parts.push(`## ${isUser ? "You" : "Claude"}\n${text}`);
        }
      });
    }
  }

  return parts.join("\n\n");
}

initRelay(['[contenteditable="true"]'], captureConversation);
