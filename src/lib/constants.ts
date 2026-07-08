export const SITES: Record<string, { hostname: string; inputSelector: string; buttonInsertSelector?: string }> = {
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
  PERPLEXITY: {
    hostname: "perplexity.ai",
    inputSelector: 'textarea, [contenteditable="true"]',
  },
  GROK: {
    hostname: "grok.com",
    inputSelector: 'textarea, [contenteditable="true"]',
  },
  MISTRAL: {
    hostname: "chat.mistral.ai",
    inputSelector: 'textarea, [contenteditable="true"]',
  },
};

export const EXTENSION_STORAGE_KEY = "context-relay";
export const EXTENSION_NAME = "Context Relay";
export const POPUP_WIDTH = 420;
export const POPUP_HEIGHT = 600;

export const TEMPLATES = [
  {
    id: "web-app",
    name: "Web App",
    description: "React / Next.js web application",
    icon: "🌐",
    currentTask: "Building a [type] web application with [framework]. Need to implement [core features] with authentication, responsive design, and [deployment target].",
    keyDecisions: "Using [framework] with TypeScript\n[State management solution]\n[Database / ORM]\nDeployed on [platform]\nAuthentication via [auth provider]",
    relevantLinks: "Repository link\nDesign files (Figma)\nDeployment URL",
    additionalNotes: "Target launch: [date]. Must support [browsers/devices]. Performance budget: [metric].",
    tags: ["web", "react", "fullstack"],
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "React Native / Flutter mobile app",
    icon: "📱",
    currentTask: "Developing a [type] mobile app for iOS and Android. Features include [core features], push notifications, and offline support.",
    keyDecisions: "React Native with Expo / Flutter\nSupabase / Firebase for backend\nRevenueCat for subscriptions\nReanimated for animations",
    relevantLinks: "Expo / Xcode project\nSupabase project\nDesign files (Figma)",
    additionalNotes: "Beta testing starts [date]. Must support offline mode. Need to integrate HealthKit / Google Fit.",
    tags: ["mobile", "react-native", "cross-platform"],
  },
  {
    id: "api",
    name: "REST / GraphQL API",
    description: "Backend API service",
    icon: "⚙️",
    currentTask: "Designing a REST/GraphQL API for [project]. Endpoints for [features] with authentication, rate limiting, and [schema].",
    keyDecisions: "Fastify / Express / Hono with TypeScript\nPostgreSQL / MongoDB for storage\nRedis for caching\nJWT-based authentication\nRate limiting: [limit] req/min",
    relevantLinks: "GitHub repository\nAPI spec (Swagger/OpenAPI)\nDocumentation link",
    additionalNotes: "Must support [query language]. Image upload limit: [size]. Needs [number] 9s uptime.",
    tags: ["api", "backend", "database"],
  },
  {
    id: "chrome-extension",
    name: "Browser Extension",
    description: "Chrome / Firefox / Edge extension",
    icon: "🧩",
    currentTask: "Building a browser extension for [purpose]. Manifest v3 with [features] including side panel, content scripts, and storage sync.",
    keyDecisions: "Manifest v3\nReact for UI pages\nVite for build\nChrome Storage API for persistence\nContent scripts for page interaction",
    relevantLinks: "Chrome Developer Dashboard\nExtension source code\nDesign mockups",
    additionalNotes: "Target browsers: Chrome, Firefox, Edge. Need to handle permissions carefully. Publishing to Chrome Web Store.",
    tags: ["extension", "chrome", "browser"],
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "Marketing / product landing page",
    icon: "🎨",
    currentTask: "Creating a landing page for [product/service]. Sections include hero, features, testimonials, pricing, and CTA. Needs SEO optimization and analytics.",
    keyDecisions: "Static site / Next.js for SSR\nTailwindCSS for styling\nFramer Motion / GSAP for animations\nVercel / Netlify for deployment",
    relevantLinks: "Figma design file\nCopy deck (Notion/Google Docs)\nDeployment preview",
    additionalNotes: "Must load under 2s on mobile. SEO keywords: [keywords]. A/B test hero CTA. Accessibility target: WCAG AA.",
    tags: ["web", "landing", "marketing"],
  },
  {
    id: "ai-agent",
    name: "AI Agent / Tool",
    description: "LLM-powered agent or tool",
    icon: "🤖",
    currentTask: "Building an AI agent that [purpose]. Using [LLM provider] API with [framework] for tool calling, memory, and [features].",
    keyDecisions: "OpenAI / Anthropic / Gemini API\nLangChain / Vercel AI SDK for orchestration\nVector store for RAG (Pinecone / Supabase)\nStreaming responses via Server-Sent Events",
    relevantLinks: "API documentation\nPrompt repository\nEvaluation results",
    additionalNotes: "Token budget: [number] per session. Need to handle rate limits. Implement human-in-the-loop for critical actions.",
    tags: ["ai", "agent", "llm"],
  },
];