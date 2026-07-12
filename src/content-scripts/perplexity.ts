import { initRelay } from "./shared";

function captureConversation(): string {
  // 1. If the user highlighted specific text, ONLY capture that!
  const selection = window.getSelection()?.toString().trim();
  if (selection && selection.length > 10) {
    return `## Selected Context\n${selection}`;
  }

  const parts: string[] = [];

  // Perplexity: look for thread/chat containers
  const conversation = document.querySelector('[class*="thread"], [class*="conversation"], [class*="chat"], [class*="answer"]');
  if (!conversation) {
    // Fallback: grab all prose/text blocks that look like messages
    const textBlocks = Array.from(document.querySelectorAll<HTMLElement>("[class*=\"prose\"], [class*=\"markdown\"], p")).slice(-10);
    const text = textBlocks.map(el => el.innerText || el.textContent || "").join("\n\n").trim();
    if (text) {
      parts.push(`## Conversation\n${text}`);
    }
    return parts.join("\n\n");
  }

  // Try to identify user questions and model answers
  const turns = Array.from(conversation.querySelectorAll<HTMLElement>("[class*=\"query\"], [class*=\"answer\"], [class*=\"message\"], [class*=\"turn\"]"));
  
  // 2. Only take the last 6 turns (recent context)
  const recentTurns = turns.slice(-6);

  recentTurns.forEach((turn) => {
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
    if (text) parts.push(`## Conversation\n${text.slice(-3000)}`);
  }

  return parts.join("\n\n");
}

initRelay(['textarea', '[contenteditable="true"]'], captureConversation);
