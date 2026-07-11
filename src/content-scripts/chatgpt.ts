import { initRelay } from "./shared";

function captureConversation(): string {
  const parts: string[] = [];

  // ChatGPT: messages have data-message-author-role attribute
  const messageContainers = document.querySelectorAll<HTMLElement>(
    '[data-message-author-role="user"], [data-message-author-role="assistant"]'
  );

  messageContainers.forEach((container) => {
    const role = container.getAttribute("data-message-author-role");
    const label = role === "user" ? "You" : "Assistant";

    // Get all text content from the message body
    // ChatGPT v2 uses article > div for message content
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
