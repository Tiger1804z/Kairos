import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest s'exécute dans Node.js (pas de DOM navigateur)
    environment: "node",
    // Cherche les fichiers *.test.ts dans tout src/
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
