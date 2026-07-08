import type { Project, Primer } from "../types";

const now = new Date();
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 86400000).toISOString();

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "sample-ecom",
    name: "E-Commerce Dashboard",
    currentTask:
      "Building a real-time analytics dashboard for an e-commerce platform with sales data, inventory tracking, and customer segmentation. Need to display KPIs, revenue charts, and top-selling products.",
    keyDecisions:
      "Using React with TypeScript\nRecharts for charting library\nPrisma + PostgreSQL for data layer\nDeployed on Vercel\nRole-based access (admin vs viewer)",
    relevantLinks:
      "https://github.com/example/ecom-dashboard\nhttps://figma.com/file/ecom-dash-v2\nhttps://vercel.com/ecom-dashboard",
    additionalNotes:
      "Target launch: end of month. Need dark mode support. API rate limits from third-party analytics service are a concern.",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  },
  {
    id: "sample-fitness",
    name: "Mobile Fitness App",
    currentTask:
      "Implementing workout tracking with exercise library, timer, progress charts, and social sharing. Building for both iOS and Android using React Native.",
    keyDecisions:
      "Expo for cross-platform development\nSupabase for auth + data\nRevenueCat for subscriptions\nReact Native Reanimated for animations",
    relevantLinks:
      "https://expo.dev/projects/fitness-app\nhttps://supabase.com/project/fitness-prod\nhttps://figma.com/file/fitness-app",
    additionalNotes:
      "Beta testing starts next week. Must support offline mode for gym use. Need to integrate Apple Health and Google Fit for step data.",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: "sample-blog",
    name: "Blog Platform API",
    currentTask:
      "Designing and implementing a REST API for a multi-tenant blog platform with markdown support, tag-based categorization, full-text search, and image uploads.",
    keyDecisions:
      "Fastify with TypeScript for the API layer\nSQLite for dev / PostgreSQL for production\nRedis for caching frequently accessed posts\nMinIO for image storage\nJWT-based authentication",
    relevantLinks:
      "https://github.com/org/blog-api\nhttps://www.notion.so/api-spec\nhttps://fastify.dev/docs",
    additionalNotes:
      "Need rate limiting (100 req/min per tenant). Image upload limit 5MB. Must support both REST and GraphQL endpoints eventually.",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(3),
  },
];

function formatPrimer(project: Project): string {
  const bulletLines = (text: string): string => {
    if (!text.trim()) return "• None";
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `• ${line}`)
      .join("\n");
  };

  const sections: string[] = [];
  sections.push(`PROJECT: ${project.name}`);
  sections.push("");
  sections.push("CURRENT TASK:");
  sections.push(project.currentTask || "—");
  sections.push("");
  sections.push("KEY DECISIONS:");
  sections.push(bulletLines(project.keyDecisions));
  sections.push("");
  sections.push("RELEVANT LINKS:");
  sections.push(bulletLines(project.relevantLinks));
  sections.push("");
  sections.push("ADDITIONAL NOTES:");
  sections.push(project.additionalNotes || "—");
  return sections.join("\n");
}

export const SAMPLE_PRIMERS: Primer[] = [
  {
    id: "primer-ecom-1",
    projectId: "sample-ecom",
    content: formatPrimer(SAMPLE_PROJECTS[0]),
    createdAt: daysAgo(1),
  },
  {
    id: "primer-ecom-2",
    projectId: "sample-ecom",
    content: formatPrimer({ ...SAMPLE_PROJECTS[0], additionalNotes: SAMPLE_PROJECTS[0].additionalNotes + "\n\nUPDATE: Dark mode implementation approved. Will use CSS variables." }),
    createdAt: daysAgo(0.5),
  },
  {
    id: "primer-fitness-1",
    projectId: "sample-fitness",
    content: formatPrimer(SAMPLE_PROJECTS[1]),
    createdAt: daysAgo(2),
  },
  {
    id: "primer-blog-1",
    projectId: "sample-blog",
    content: formatPrimer(SAMPLE_PROJECTS[2]),
    createdAt: daysAgo(3),
  },
];