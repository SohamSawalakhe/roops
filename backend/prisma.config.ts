import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load environment variables matching Next.js precedence:
// .env.local takes precedence over .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
