export const PRIMER_GENERATOR_URL =
  "https://bnkanwtzusfbsbqthona.supabase.co/functions/v1/generate-primer";

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
    id: "personal-project",
    name: "Personal Project",
    description: "Home renovation, event planning, hobby projects",
    icon: "🏠",
    currentTask: "Planning a [type of project] — [brief description]. Need to figure out [main challenge], budget for [materials/services], and timeline for [milestone].",
    keyDecisions: "Budget: [amount]\nTimeline: [start date] → [end date]\nDIY vs hiring help: [which]\nTop priority: [what matters most]",
    relevantLinks: "Pinterest / inspiration board\nVendor quotes\nBudget spreadsheet",
    additionalNotes: "Space constraints: [details]. Preferred aesthetic: [style]. Must finish by [deadline].",
    tags: ["diy", "planning", "lifestyle"],
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    description: "Fitness, nutrition, habits, mindfulness",
    icon: "🧘",
    currentTask: "Working on [health goal] — [specific target like run 5k / lose X kg / meditate daily]. Current baseline: [starting point]. Struggling with [obstacle].",
    keyDecisions: "Primary focus: [fitness / nutrition / sleep / stress]\nSchedule: [days per week / time of day]\nTracking method: [app / journal / none]\nAccountability partner: [yes / no]",
    relevantLinks: "Workout plan / app\nMeal prep recipes\nProgress photos / log",
    additionalNotes: "Medical considerations: [any injuries / conditions]. Equipment available: [gym / home / none]. Target habit: [specific daily action].",
    tags: ["fitness", "habits", "lifestyle"],
  },
  {
    id: "research-essay",
    name: "Research & Essay",
    description: "Papers, theses, research projects, literature reviews",
    icon: "📝",
    currentTask: "Writing a [paper/thesis/report] on [topic]. Need to cover [key arguments], find sources on [subtopic], and structure it around [thesis statement].",
    keyDecisions: "Format: [APA / MLA / Chicago / other]\nWord count target: [number]\nCore sources: [primary references]\nArgument structure: [problem → analysis → conclusion / compare & contrast]",
    relevantLinks: "Google Scholar / library search\nSource PDFs / Zotero library\nOutline doc (Notion / Google Docs)",
    additionalNotes: "Submission deadline: [date]. Advisor/grader: [name]. Need peer review by [date]. Must include [diagrams / data / appendices].",
    tags: ["academic", "writing", "research"],
  },
  {
    id: "exam-prep",
    name: "Exam Preparation",
    description: "Study plans, flashcards, revision strategies",
    icon: "📚",
    currentTask: "Studying for [exam name] on [date]. Topics include [list of subjects]. Currently at [comfort level with material]. Need to focus on [weakest topic].",
    keyDecisions: "Study method: [Active recall / Pomodoro / Spaced repetition]\nResources: [textbook / lectures / practice exams]\nStudy schedule: [hours per day / days per week]\nPractice tests: [number planned]",
    relevantLinks: "Syllabus / exam guide\nFlashcards (Anki / Quizlet)\nPast papers / mock exams",
    additionalNotes: "Target score: [grade / percentile]. Study buddy group: [yes / no]. Exam format: [multiple choice / essay / practical].",
    tags: ["studying", "academic", "planning"],
  },
  {
    id: "business-strategy",
    name: "Business Strategy",
    description: "Business plans, pitches, proposals, go-to-market",
    icon: "💼",
    currentTask: "Developing a [business plan / pitch deck / proposal] for [venture]. Key value proposition: [what you offer]. Target market: [customer segment]. Revenue model: [how you make money].",
    keyDecisions: "Business model: [SaaS / marketplace / service / e-commerce]\nPricing: [per month / per use / tiered]\nFunding stage: [bootstrapped / pre-seed / seed]\nGo-to-market: [organic / paid / partnerships]",
    relevantLinks: "Market research / competitor analysis\nFinancial projections spreadsheet\nInvestor / partner list",
    additionalNotes: "Launch target: [date]. Break-even goal: [month]. Key risk: [biggest unknown]. Advisory board: [names].",
    tags: ["business", "strategy", "entrepreneurship"],
  },
  {
    id: "career-job",
    name: "Career & Job Search",
    description: "Resumes, interviews, career transitions, networking",
    icon: "🎯",
    currentTask: "Applying for [role type] roles in [industry/field]. Currently at [current role]. Target companies: [list]. Biggest gap to fill: [skill or experience needed].",
    keyDecisions: "Target roles: [job titles]\nPriority factors: [salary / culture / growth / location]\nApplication strategy: [quality over quantity / spray and pray]\nTimeline: [start date → offer by date]",
    relevantLinks: "Resume / CV (current draft)\nPortfolio / GitHub / LinkedIn\nJob boards / company career pages",
    additionalNotes: "Salary range: [min–max]. Willing to relocate: [yes / no / hybrid]. Need to prep for: [technical / behavioral / case interviews].",
    tags: ["career", "growth", "business"],
  },
  {
    id: "software-project",
    name: "Software Project",
    description: "Features, fixes, architecture, code reviews",
    icon: "💻",
    currentTask: "Working on [project name] — [feature / bug / refactor]. Need to implement [specific change], consider trade-offs between [option A] vs [option B], and ensure [quality concern like tests / performance / security].",
    keyDecisions: "Stack: [language / framework / runtime]\nArchitecture approach: [pattern / design decision]\nDatabase / storage: [which one]\nDeployment target: [platform / environment]",
    relevantLinks: "GitHub / repo link\nPR / issue link\nAPI docs / spec",
    additionalNotes: "Deadline: [date]. Dependencies: [blocking items]. Needs review from: [name(s)]. Risk areas: [complex parts to watch out for].",
    tags: ["dev", "code", "engineering"],
  },
];