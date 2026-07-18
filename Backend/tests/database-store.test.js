import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import {
  initializeStore,
  createUserRecord,
  findUserByEmail,
  findUserById,
} from "../src/database/fileStore.js";
import { resolveDatabaseMode } from "../src/database/dbMode.js";

test("selects the local file backend when no database URL is configured", () => {
  delete process.env.DATABASE_URL;
  assert.equal(resolveDatabaseMode(), "file");
});

test("stores and retrieves users from the local JSON database", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "auth-store-"));
  process.env.AUTH_DB_PATH = path.join(tempDir, "users.json");

  try {
    await initializeStore();

    const createdUser = await createUserRecord({
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      password_hash: "hashed-password",
    });

    assert.equal(createdUser.full_name, "Ada Lovelace");
    assert.equal(createdUser.email, "ada@example.com");

    const byEmail = await findUserByEmail("ada@example.com");
    assert.ok(byEmail);
    assert.equal(byEmail.password_hash, "hashed-password");

    const byId = await findUserById(createdUser.id);
    assert.ok(byId);
    assert.equal(byId.id, createdUser.id);
  } finally {
    delete process.env.AUTH_DB_PATH;
    await rm(tempDir, { recursive: true, force: true });
  }
});
