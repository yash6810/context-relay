import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // ChatGPT: messages have data-message-author-role attribute, or article tags
  let messageContainers = document.querySelectorAll<HTMLElement>(
    '[data-message-author-role="user"], [data-message-author-role="assistant"], article'
  );

  // Fallback if ChatGPT changed their entire DOM structure
  if (messageContainers.length === 0) {
    const mainText = document.querySelector('main')?.innerText || document.body.innerText || "";
    if (mainText.length > 50) {
      return `## Conversation\n\n${mainText}`;
    }
  }

  // Use a Set to avoid duplicating articles if they matched both selectors
  const processed = new Set<HTMLElement>();

  messageContainers.forEach((container) => {
    if (processed.has(container)) return;
    processed.add(container);

    const role = container.getAttribute("data-message-author-role");
    let label = role === "user" ? "You" : "Assistant";
    
    // If using <article>, infer role from text or avatar
    if (!role && container.tagName.toLowerCase() === 'article') {
       const text = container.innerText || "";
       if (text.startsWith("You\n")) label = "You";
       else label = "Assistant";
    }

    // Get all text content from the message body
    const textEls = container.querySelectorAll(
      ".markdown, .whitespace-pre-wrap, [data-message-content]"
    );

    let text = "";
    if (textEls.length > 0) {
      text = Array.from(textEls)
        .map((el) => (el as HTMLElement).innerText || (el as HTMLElement).textContent || "")
        .join("\n")
        .trim();
    } else {
      // Fallback: get all text from the container
      text = container.innerText || container.textContent || "";
      text = text.replace(/^You\s*/, "").replace(/^ChatGPT\s*/, "").trim();
    }

    if (text) {
      parts.push(`## ${label}\n${text}`);
    }
  });

  return parts.join("\n\n");
}

initRelay(["#prompt-textarea"], captureConversation);
