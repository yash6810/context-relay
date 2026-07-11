import { build } from "esbuild";

const contentScriptsDir = "src/content-scripts";
const platforms = ["chatgpt", "claude", "gemini", "perplexity", "grok", "mistral"];

for (const platform of platforms) {
  await build({
    entryPoints: [`${contentScriptsDir}/${platform}.ts`],
    bundle: true,
    format: "iife",
    outfile: `dist/scripts/content-${platform}.js`,
    platform: "browser",
    target: "chrome100",
  });
}

console.log("Content scripts built successfully.");