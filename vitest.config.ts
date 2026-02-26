import path from "node:path";
import { defineConfig, defineProject } from "vitest/config";
import {
  defineWorkersProject,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

const migrationsPath = path.join(import.meta.dirname, "migrations");
const migrations = await readD1Migrations(migrationsPath);

export default defineConfig({
  test: {
    projects: [
      // Worker tests — run inside workerd via Miniflare
      defineWorkersProject({
        test: {
          name: "worker",
          include: ["test/worker/**/*.test.ts"],
          setupFiles: ["./test/apply-migrations.ts"],
          poolOptions: {
            workers: {
              singleWorker: true,
              wrangler: { configPath: "./wrangler.toml" },
              miniflare: {
                bindings: { TEST_MIGRATIONS: migrations },
              },
            },
          },
        },
      }),

      // Client-side DOM tests — run in happy-dom
      defineProject({
        test: {
          name: "client",
          include: ["test/client/**/*.test.ts", "test/ui/**/*.test.ts"],
          environment: "happy-dom",
        },
      }),

      // Scanner tests — run in Node.js
      defineProject({
        test: {
          name: "scanner",
          include: ["test/scanner/**/*.test.ts"],
          environment: "node",
        },
      }),
    ],
  },
});
