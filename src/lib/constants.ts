export const SITES = {
  CHATGPT: {
    hostname: "chatgpt.com",
    inputSelector: "#prompt-textarea",
    buttonInsertSelector: '[data-testid="send-button"]',
  },
  CLAUDE: {
    hostname: "claude.ai",
    inputSelector: '[contenteditable="true"]',
  },
  GEMINI: {
    hostname: "gemini.google.com",
    inputSelector: '[contenteditable="true"]',
  },
} as const;

export const EXTENSION_STORAGE_KEY = "context-relay";
export const EXTENSION_NAME = "Context Relay";
export const POPUP_WIDTH = 420;
export const POPUP_HEIGHT = 600;