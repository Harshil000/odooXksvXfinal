export function resolveDatabaseMode() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? "postgres" : "file";
}
