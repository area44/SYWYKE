import { createClient } from "@libsql/client";

const url = process.env.TURSO_CONNECTION_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});
