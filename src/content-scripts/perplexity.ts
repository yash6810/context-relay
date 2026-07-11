import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // Perplexity: look for thread/chat containers
  const conversation = document.querySelector('[class*="thread"], [class*="conversation"], [class*="chat"], [class*="answer"]');
  if (!conversation) {
    // Fallback: grab all prose/text blocks that look like messages
    const textBlocks = document.querySelectorAll<HTMLElement>("[class*=\"prose\"], [class*=\"markdown\"], p");
    const text = Array.from(textBlocks).map(el => el.innerText || el.textContent || "").join("\n\n").trim();
    if (text) {
      parts.push(`## Conversation\n${text}`);
    }
    return parts.join("\n\n");
  }

  // Try to identify user questions and model answers
  const turns = conversation.querySelectorAll<HTMLElement>("[class*=\"query\"], [class*=\"answer\"], [class*=\"message\"], [class*=\"turn\"]");
  
  turns.forEach((turn) => {
    const isUser = turn.matches('[class*="query"], [class*="question"]') ||
      turn.closest('[class*="query"], [class*="question"]') !== null;

    const label = isUser ? "You" : "Perplexity";
    const text = (turn as HTMLElement).innerText?.trim();
    if (text && text.length > 5) {
      parts.push(`## ${label}\n${text}`);
    }
  });

  // If turns didn't work, grab all structured text
  if (parts.length === 0) {
    const text = (conversation as HTMLElement).innerText?.trim();
    if (text) parts.push(`## Conversation\n${text}`);
  }

  return parts.join("\n\n");
}

initRelay(['textarea', '[contenteditable="true"]'], captureConversation);
