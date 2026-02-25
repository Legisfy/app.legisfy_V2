import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
function toArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [...toArray(react())];

  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      const tagger = componentTagger();
      plugins.push(...toArray(tagger));
    } catch (err) {
      // lovable-tagger é opcional e só usado em desenvolvimento
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
